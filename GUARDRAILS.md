# GUARDRAILS.md

Hard fail-closed constraints for AI coding agents working in the Usagely repository.

Format: [guardrails.md protocol](https://guardrails.md/).
Each Sign has four labelled lines:

- **Trigger** — the situation that activates the rule.
- **Instruction** — what to do (or not do).
- **Reason** — why, in one sentence.
- **Provenance** — where and when the Sign was introduced.

**Append-only.** Never delete or weaken a Sign. Violations get a NEW Sign, never a deletion.

**Reference, not replace.** `AGENTS.md` (and its scoped variants) explain conventions. `GUARDRAILS.md` is the hard fail-closed list. Both are read at session start.

---

## Signs

### Sign 1 — schema changes via new migration only

**Trigger:** any change to the database schema.
**Instruction:** ALWAYS add a new paired `*.up.sql` / `*.down.sql` file under `server/migrations/`. NEVER edit a migration that is already committed.
**Reason:** migration files become the production audit trail; mutating committed ones silently breaks every deploy that ran against the old version.
**Provenance:** seed (issue #1, 2026-05-01)

### Sign 2 — sqlc generate after every query change

**Trigger:** editing any `*.sql` file under `server/migrations/` or `server/internal/db/queries/`.
**Instruction:** ALWAYS run `sqlc generate` from `server/` and commit the regenerated Go alongside the SQL change in the same commit.
**Reason:** drift between query SQL and generated Go is the single biggest source of hallucinated method names in this codebase.
**Provenance:** seed (issue #1, 2026-05-01)

### Sign 3 — every DB query in a handler MUST filter by org_id

**Trigger:** writing or modifying any handler that calls a sqlc-generated query.
**Instruction:** the query MUST take an `OrgID` parameter sourced from the authenticated session context.
**Reason:** cross-tenant leakage is the #1 product risk in a multi-tenant FinOps platform.
**Provenance:** seed (issue #1, 2026-05-01)

### Sign 4 — dependency manifest changes require explicit approval

**Trigger:** editing `server/sqlc.yaml`, root `package.json` (deps), `pnpm-lock.yaml`, `go.mod`, or `go.sum`.
**Instruction:** do NOT edit these files unless the prompt explicitly says so. Surface the request to the human first.
**Reason:** dependency drift is hard to review and easy to slip past CI; it must be a deliberate human decision.
**Provenance:** seed (issue #1, 2026-05-01)

### Sign 5 — /ee license boundary

**Trigger:** an OSS-only task touching anything under `ee/`, OR any path outside `ee/` importing from `ee/`.
**Instruction:** BLOCKED. Stop and ask the human.
**Reason:** `ee/` is commercial-licensed; the rest is AGPL-3.0; mixing them re-licenses the wrong way in either direction.
**Provenance:** seed (issue #1, 2026-05-01)

### Sign 6 — no type-suppression escape hatches

**Trigger:** introducing `as any`, `@ts-ignore`, `@ts-expect-error`, or new `interface{}` casts in Go production code.
**Instruction:** BLOCKED. Fix the type instead.
**Reason:** every suppression hides a bug that will surface later, usually in production, usually for the on-call.
**Provenance:** seed (issue #1, 2026-05-01)

### Sign 7 — destructive git is human-only

**Trigger:** `git commit --no-verify`, `git push --force` (or `--force-with-lease`) on `main`, `git reset --hard` on a shared branch.
**Instruction:** REQUIRES explicit human approval in the current prompt. No standing permission.
**Reason:** these commands rewrite history other people depend on; one bad invocation is permanent and noisy to recover from.
**Provenance:** seed (issue #1, 2026-05-01)

### Sign 8 — never log or return secrets

**Trigger:** any code path that touches `JWT_SECRET`, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, raw JWTs, or any value that came from a `*_KEY` / `*_SECRET` / `*_TOKEN` env var.
**Instruction:** BLOCKED from `fmt.Println`, `log.*`, `console.log`, `console.error`, response bodies, error messages, and structured-log fields. Use static log strings.
**Reason:** secrets in logs are unrecoverable once written; treat the log as adversarial.
**Provenance:** seed (issue #1, 2026-05-01)

### Sign 9 — failing tests are signal, not noise

**Trigger:** a test that was passing now fails after your change.
**Instruction:** BLOCKED from deleting, skipping (`t.Skip`, `it.skip`), or commenting out the test. Fix the code OR explicitly justify the test change in the PR description.
**Reason:** deleting failing tests is the canonical AI-slop pattern for green CI; it ships bugs.
**Provenance:** seed (issue #1, 2026-05-01)

### Sign 10 — stop after 2 failed attempts

**Trigger:** two consecutive failed attempts at the same fix.
**Instruction:** STOP. Summarize what was tried, what failed, and propose 2-3 materially different alternatives. Do NOT keep retrying.
**Reason:** shotgun debugging burns iterations and produces tangled diffs; a forced step-back is cheaper than a wrong commit.
**Provenance:** seed (issue #1, 2026-05-01)

---

## How to add a Sign

1. Pick the next sequential number (never renumber existing Signs).
2. Add a `### Sign N — <slug>` block with the four labelled lines: `**Trigger:**`, `**Instruction:**`, `**Reason:**`, `**Provenance:**`.
3. Set `**Provenance:**` to `<commit-sha-or-PR-number>, <YYYY-MM-DD>`.
4. Never delete or weaken an existing Sign. If a Sign is wrong, add a new Sign that supersedes it.
