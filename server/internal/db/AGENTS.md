# server/internal/db/AGENTS.md

Scoped rules for the sqlc workflow.

## Source files

- **Queries**: `server/internal/db/queries/*.sql`
- **Schema**: `server/migrations/*.sql`

Both feed [`server/sqlc.yaml`](../../sqlc.yaml).

## Generated files

Everything under `server/internal/db/` that is not inside `queries/` is sqlc
output — do not edit by hand.

## Workflow

1. Edit a query in `server/internal/db/queries/` OR add a migration in
   `server/migrations/`.
2. From `server/`, run `sqlc generate`.
3. Commit the regenerated Go files alongside the SQL change in the same commit.

## Rules

- Never call `pool.Query` / `pool.Exec` directly outside generated code —
  always go through `db.New(pool).<MethodName>`.
- Never invent a method name. If `sqlc generate` does not produce it, it does
  not exist. Read the generated Go to confirm before calling it.
