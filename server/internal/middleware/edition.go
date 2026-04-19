package middleware

import (
	"encoding/json"
	"net/http"
	"strings"
)

var eeOnlyPrefixes = []string{
	"/api/v1/recommendations",
	"/api/v1/shadow",
	"/api/v1/approvals",
	"/api/v1/forecast",
}

func EditionGate(serverEdition string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			edition := r.Header.Get("X-Edition")
			if edition == "" {
				edition = serverEdition
			}

			if edition == "oss" && isEERoute(r.URL.Path) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusForbidden)
				_ = json.NewEncoder(w).Encode(map[string]string{
					"error": "enterprise edition required",
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func isEERoute(path string) bool {
	for _, prefix := range eeOnlyPrefixes {
		if strings.HasPrefix(path, prefix) {
			return true
		}
	}
	return false
}
