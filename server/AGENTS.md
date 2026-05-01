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

## Verify before committing

```bash
cd server
go vet ./...
go test ./...
```
