package handler

import (
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"testing"
)

// poolMethods lists the pgxpool.Pool methods that execute SQL.
var poolMethods = map[string]bool{
	"Query":    true,
	"QueryRow": true,
	"Exec":     true,
}

// allowlist maps "filename:line" to a reason. Empty for now — add entries
// only for genuinely org-agnostic queries with a comment explaining why.
var allowlist = map[string]string{}

func TestTenancyLint(t *testing.T) {
	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("cannot determine test file location")
	}
	handlerDir := filepath.Dir(thisFile)

	entries, err := os.ReadDir(handlerDir)
	if err != nil {
		t.Fatalf("reading handler dir: %v", err)
	}

	fset := token.NewFileSet()
	var violations []string

	for _, entry := range entries {
		name := entry.Name()
		if entry.IsDir() {
			continue
		}
		if !strings.HasSuffix(name, ".go") {
			continue
		}
		if strings.HasSuffix(name, "_test.go") || strings.HasSuffix(name, ".bak") {
			continue
		}

		path := filepath.Join(handlerDir, name)
		src, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("reading %s: %v", name, err)
		}
		lines := strings.Split(string(src), "\n")

		f, err := parser.ParseFile(fset, path, src, parser.ParseComments)
		if err != nil {
			t.Fatalf("parsing %s: %v", name, err)
		}

		ast.Inspect(f, func(n ast.Node) bool {
			call, ok := n.(*ast.CallExpr)
			if !ok {
				return true
			}

			sel, ok := call.Fun.(*ast.SelectorExpr)
			if !ok {
				return true
			}
			if !poolMethods[sel.Sel.Name] {
				return true
			}

			// Need at least 2 args: context + SQL string.
			if len(call.Args) < 2 {
				return true
			}

			pos := fset.Position(call.Pos())
			key := name + ":" + strconv.Itoa(pos.Line)

			// Check allowlist.
			if _, ok := allowlist[key]; ok {
				return true
			}

			// Check for // tenancy:ok on the preceding line.
			if pos.Line >= 2 {
				prev := lines[pos.Line-2] // lines is 0-indexed, pos.Line is 1-indexed
				if strings.Contains(prev, "// tenancy:ok") {
					return true
				}
			}

			sqlArg := call.Args[1]
			lit, ok := sqlArg.(*ast.BasicLit)
			if !ok {
				violations = append(violations,
					pos.String()+": SQL passed to "+sel.Sel.Name+
						" is not a string literal — dynamic SQL must be guarded"+
						" by a manual code review; add `// tenancy:ok <reason>` on the line above to suppress")
				return true
			}
			if lit.Kind != token.STRING {
				return true
			}
			if !strings.Contains(strings.ToLower(lit.Value), "org_id") {
				violations = append(violations,
					pos.String()+": SQL passed to "+sel.Sel.Name+
						" does not contain 'org_id' and is not allowlisted")
			}

			return true
		})
	}

	for _, v := range violations {
		t.Errorf("tenancy: %s", v)
	}
}
