# Sandboxed AI Agent Workflow (Sandcastle)

This directory wires [sandcastle](https://github.com/mattpocock/sandcastle)
into the Usagely repo as an **optional** developer tool. It lets a maintainer
hand a task to a Claude Code agent that runs inside an isolated Docker
container with the full Usagely toolchain (Go 1.25, Node 22, pnpm 9,
PostgreSQL client, GitHub CLI) preinstalled. The agent's commits are merged
back into your local `HEAD` when the run finishes.

You only need this if you want to drive AFK coding agents against the repo.
None of the regular `make dev` / `make build` / `make test` / CI flows depend
on it.

## Prerequisites

- Docker Desktop (or any Docker daemon you can talk to from the CLI)
- pnpm 9 (already required by Usagely)
- Claude auth — pick one:
  - **Claude Pro/Max subscription (preferred)** — run `claude login` once on
    the host. Credentials land in `~/.claude/` and `~/.claude.json`, and
    `main.mts` bind-mounts both into the sandbox so the in-container Claude
    CLI reuses your subscription. Sandcastle does not officially support
    this (upstream `wontfix`:
    [issue #191](https://github.com/mattpocock/sandcastle/issues/191)) —
    we wire it up locally via the bind-mount.
  - **API key fallback** — set `ANTHROPIC_API_KEY` in `.sandcastle/.env` if
    you don't have a subscription. The script auto-detects which path to
    use.
- Host UID **1000** for the subscription path (the in-sandbox `agent` user
  is UID 1000, so credential files must be readable by 1000 on the host).
  Run `id -u` to check; on most single-user dev machines this is already
  the case.

## One-time setup

```bash
# from repo root

# (subscription users) make sure you're logged in on the host:
claude login

# (API-key users) copy the env template and fill in ANTHROPIC_API_KEY:
cp .sandcastle/.env.example .sandcastle/.env

# build the sandbox image (once per Dockerfile change)
pnpm exec sandcastle docker build-image --image-name sandcastle:usagely
```

The `pnpm install` you ran at the repo root already pulled
`@ai-hero/sandcastle` and `tsx` as devDependencies — no extra install needed.

## Running an agent

```bash
pnpm sandcastle "Add a /healthz/db endpoint to the Go API that pings Postgres."
```

Under the hood that runs `tsx .sandcastle/main.ts` with everything after the
script name passed as the task (the entry point is
[`main.mts`](./main.mts) — `.mts` so top-level `await` works without
flipping the root `package.json` to `"type": "module"`). The task string is
substituted into [`prompt.md`](./prompt.md) as `{{TASK}}`.

## What happens during a run

1. Sandcastle creates a temporary git branch (default strategy:
   `merge-to-head`) and a worktree for the agent to operate on.
2. A Docker container based on [`Dockerfile`](./Dockerfile) is started, with
   the worktree bind-mounted at the sandbox repo root.
3. The `sandbox.onSandboxReady` hooks defined in [`main.mts`](./main.mts) run
   inside the container — `pnpm install --frozen-lockfile` and
   `go mod download` warm the dependency caches.
4. Claude Code receives the resolved prompt and iterates against the
   sandboxed worktree, committing as it goes (up to 10 iterations).
5. When the agent emits `<promise>COMPLETE</promise>` (or hits
   `maxIterations`) the sandbox shuts down and the agent's commits are
   merged into your `HEAD` branch on the host.

Logs are written to `.sandcastle/logs/` (gitignored). The sandbox image is
named `sandcastle:usagely`; rebuild it whenever `Dockerfile` changes.

## Customising

- **Model**: edit the `claudeCode("claude-opus-4-6")` call in `main.mts`.
- **Named branch instead of merge-to-head**: change `branchStrategy` in
  `main.mts` to `{ type: "branch", branch: "agent/<slug>" }`. Useful when you
  want to open a PR from the agent's branch rather than fold the work into
  `HEAD`.
- **Extra system dependencies**: add them to `Dockerfile` and rebuild the
  image.
- **Different prompt template**: edit `prompt.md`. Use `!` `command` `` (`!`
  followed by a backtick-wrapped shell command) to inject dynamic context
  resolved inside the sandbox at run time.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `No Claude credentials found` | Run `claude login` on the host (subscription) **or** copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY` (API key). |
| Agent prompts for an API key inside the sandbox | Subscription bind-mount didn't land. Check `id -u` on the host equals `1000`, that `~/.claude/.credentials.json` exists, and that nothing else is rewriting `.claude.json` while the run is in flight. |
| `Cannot connect to the Docker daemon` | Start Docker Desktop / `systemctl start docker`. |
| `image sandcastle:usagely not found` | Run `pnpm exec sandcastle docker build-image --image-name sandcastle:usagely`. |
| Agent fails on `pnpm install` | The lockfile changed since the image was built; rebuild the image. |
| Worktree left behind in `.sandcastle/worktrees/` | The run errored mid-iteration. Inspect, then `rm -rf` it once you've recovered any work. |

For deeper docs see the upstream
[sandcastle README](https://github.com/mattpocock/sandcastle#readme).
