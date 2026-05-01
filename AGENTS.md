# AGENTS.md

Instructions for AI coding agents working in the Usagely repository.

## Project overview

Usagely is an open-source FinOps-for-AI platform that helps organizations
monitor, control, and optimize spending on AI tools and LLM services. The
project uses an OSS + EE split: core features are AGPL-3.0 licensed in the
main repo, and enterprise features live under `/ee` with a commercial license.

## Tech stack

| Component | Version | Source |
|---|---|---|
| Go | 1.25.0 | `server/go.mod` |
| Node.js | unpinned (README says 20+) | — |
| pnpm | 9.0.0 | root `package.json` `packageManager` |
| Turborepo | ^2.0.0 | root `package.json` devDependencies |
| Next.js | 16.2.4 | `apps/web/package.json` |
| React | 19.2.4 | `apps/web/package.json` |
| TypeScript | ^5 | `apps/web/package.json` |
| TailwindCSS | ^3.4.17 | `apps/web/package.json` |
| shadcn | ^4.3.0 | `apps/web/package.json` |
| better-auth | ^1.6.5 | `apps/web/package.json` |
| chi | v5.2.5 | `server/go.mod` |
| pgx | v5.9.2 | `server/go.mod` |
| golang-migrate | v4.19.1 | `server/go.mod` |
| sqlc | config v2, binary unpinned | `server/sqlc.yaml` |
| PostgreSQL | 17 | `docker-compose.yml` (`postgres:17-alpine`) |

## Key commands

### Make targets (run from repo root)

| Command | Description |
|---|---|
| `make dev` | Start frontend (turbo) and Go API dev servers |
| `make build` | Build frontend via turbo + compile Go binary to `./bin/api` |
| `make test` | Run frontend tests via turbo + Go tests for backend |
| `make lint` | Run `pnpm turbo lint` |
| `make migrate` | Run database migrations via `go run ./server/cmd/migrate` |
| `make seed` | Seed database via `go run ./server/cmd/seed` |

### pnpm / Turborepo (run from repo root)

| Command | Description |
|---|---|
| `pnpm install` | Install all workspace dependencies |
| `pnpm turbo dev` | Start all workspace dev servers |
| `pnpm turbo build` | Build all workspaces |
| `pnpm --filter web dev` | Start Next.js dev server only |
| `pnpm --filter web build` | Build Next.js app only |
| `pnpm --filter web lint` | Lint frontend only |
| `pnpm --filter web test` | Run frontend tests only |

### Go (run from `server/` — that is where `go.mod` lives)

| Command | Description |
|---|---|
| `go build ./...` | Compile all Go packages |
| `go vet ./...` | Static analysis |
| `go test ./...` | Run all Go tests |

## Repository layout

```
usagely/
├── apps/
│   └── web/              # Next.js frontend
├── server/
│   ├── cmd/
│   │   ├── api/          # API server entry point
│   │   ├── migrate/      # Migration CLI
│   │   └── seed/         # Seed data CLI
│   ├── internal/
│   │   ├── config/       # Env-based configuration
│   │   ├── db/           # PostgreSQL connection pool + sqlc generated code
│   │   ├── handler/      # HTTP handlers
│   │   └── middleware/   # RequestID, Logger, Recovery, CORS
│   ├── migrations/       # SQL migration files (up/down pairs)
│   └── sqlc.yaml         # SQLC code-gen config
├── ee/
│   ├── server/           # Enterprise backend extensions
│   └── web/              # Enterprise frontend extensions
├── design/               # Design assets
├── Makefile
├── turbo.json
└── pnpm-workspace.yaml
```

## Boundaries

### Always

- Scope every DB query by `org_id` — multi-tenancy is non-negotiable.
- Match existing chi/pgx/sqlc patterns when adding handlers or queries.
- Write tests for new HTTP handlers.
- Run `make build` (or the relevant surface commands) before claiming done.
- Add new migrations as paired `*.up.sql` / `*.down.sql` in `server/migrations/`.
- Regenerate sqlc bindings (`sqlc generate` from `server/`) after changing queries or schema.

### Ask first

- Editing `server/sqlc.yaml`.
- Changing root `package.json` dependencies or `pnpm-lock.yaml`.
- Modifying `go.mod` / `go.sum`.
- Touching `docker-compose.yml` or anything under `deploy/`.
- Cross-cutting refactors that span multiple packages.

### Never

- Edit files under `/ee` from an OSS task.
- Modify a committed file under `server/migrations/` — only append new migrations.
- Use `as any`, `@ts-ignore`, or `@ts-expect-error`.
- Commit with `--no-verify`.
- Run `git push --force` on `main`.
- Log or echo secrets, JWTs, org IDs, or API keys.
- Delete failing tests to make CI green.

## Anti-patterns

- Hallucinating sqlc query method names — always check generated code in `server/internal/db/`.
- Suppressing TypeScript or Go type errors instead of fixing them.
- Refactoring unrelated code during a bug fix.
- Importing from `/ee` in OSS code.
- Adding new UI libraries instead of using existing shadcn/ui components.
- Guessing package versions not pinned in the repo.
- Running Go commands from the repo root — `go.mod` is in `server/`.
- Skipping migration down files when adding new migrations.

## How to verify your change

Single command from repo root: `make verify` (frontend test + build, then backend vet + test). Lint and a few other checks are deferred to their own PRs — see the comment block above the `verify:` target in the Makefile.

**Backend** (from `server/`):
```bash
go vet ./... && go test ./...
```

**Frontend** (from repo root):
```bash
pnpm --filter web lint && pnpm --filter web build
```

**Full build** (from repo root):
```bash
make build
```

## Pointers

- [`GUARDRAILS.md`](GUARDRAILS.md) — hard fail-closed constraints. Read at session start; never delete a Sign.
- [`README.md`](README.md) — project overview, getting started, environment variables.
- Scoped `AGENTS.md` files under `server/`, `apps/web/`, `ee/`, `server/migrations/`, and `server/internal/db/` for directory-specific rules.
