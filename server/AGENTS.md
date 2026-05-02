# server/AGENTS.md

Scoped rules for the Go backend. See the root [`AGENTS.md`](../AGENTS.md) for
project-wide context; do not duplicate it here.

## Stack

chi v5.2.5 router, pgx v5.9.2 connection pool, sqlc v2 code generation,
golang-migrate v4.19.1 for schema migrations. All versions sourced from
[`go.mod`](go.mod).

## Where things live

| Path | Purpose |
|---|---|
| `cmd/api` | HTTP server entry point |
| `cmd/migrate` | Migration CLI |
| `cmd/seed` | Seed data CLI |
| `internal/config` | Env-based configuration |
| `internal/db` | sqlc-generated code + connection pool |
| `internal/handler` | HTTP handlers |
| `internal/middleware` | RequestID, Logger, Recovery, CORS |
| `migrations/` | Paired `*.up.sql` / `*.down.sql` files |

## Conventions

- All DB queries go through sqlc-generated code in `internal/db`. Do not write
  raw `pool.Query` or `pool.Exec` in handlers — call `db.New(pool).<Method>(ctx, params)`.
- Every handler that touches a tenant table MUST scope by `org_id`. Follow the
  pattern established in existing handlers; do not invent a new one.
- Wrap errors with `fmt.Errorf("<context>: %w", err)`. Never `panic` in
  handlers — return an appropriate HTTP error instead.
- Tests live next to the file as `*_test.go`, use `net/http/httptest`, and run
  from the `server/` directory: `go test ./...`.

## Testing handlers that touch the DB

To test handlers that query the database without requiring a live Postgres
connection, use the **interface-injection** pattern:

1. Define a per-handler interface next to the handler (e.g. `ToolsRepo`).
2. Write an unexported `pgx*Repo` adapter that wraps `*pgxpool.Pool` and
   implements the interface using the existing SQL.
3. Change the handler to accept the interface instead of the pool.
4. In tests, implement the interface with a hand-written mock struct — no
   mocking libraries, no `pgx` imports in the test file.
5. Wire the adapter in `cmd/api/main.go` via its constructor.

See `internal/handler/tools.go` and `internal/handler/tools_test.go` for the
canonical example.

> This pattern is being rolled out to all handlers per
> [issue #34](https://github.com/usagely/usagely/issues/34). `tools.go` is
> Pillar 1; remaining handlers will follow in subsequent PRs.

## Verify before committing

```bash
cd server
go vet ./...
go test ./...
```
