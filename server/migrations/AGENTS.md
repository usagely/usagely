# server/migrations/AGENTS.md

Scoped rules for database migrations.

## Append-only

Never modify a committed file under `server/migrations/`. A new change means a
new pair: `NNNN_<slug>.up.sql` + `NNNN_<slug>.down.sql`, where `NNNN` is the
next zero-padded sequence number after the highest existing one. Check with:

```bash
ls server/migrations | sort | tail -2
```

## Down file is mandatory

Every up migration MUST have a matching down file that cleanly reverses it
(drop columns, drop tables, etc.).

## Running migrations

From the repo root: `make migrate` (which calls `go run ./server/cmd/migrate`).
The migrate CLI handles ordering automatically.

## Keep sqlc in sync

After any `*.sql` change, re-run `sqlc generate` from `server/` so the
generated Go bindings stay up to date. See
[`server/internal/db/AGENTS.md`](../internal/db/AGENTS.md) for the full
workflow.
