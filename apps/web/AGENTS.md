# apps/web/AGENTS.md

Scoped rules for the Next.js frontend. See the root [`AGENTS.md`](../../AGENTS.md)
for project-wide context; do not duplicate it here.

## Stack

Next.js 16.2.4, React 19.2.4, TypeScript ^5, TailwindCSS ^3.4.17, shadcn/ui
(via existing [`components.json`](components.json)), better-auth ^1.6.5 for
sessions. All versions sourced from [`package.json`](package.json).

## Where things live

| Path | Purpose |
|---|---|
| `app/` | App Router routes (`(dashboard)`, `login`, `api`) |
| `components/` | Shared UI components |
| `components/ui/` | shadcn/ui primitives |
| `lib/` | Helpers + auth client |
| `src/` | Legacy — prefer `app/` and `components/` first |
| `scripts/` | Dev utilities (auth migration, seeding) |

The `auth.db` SQLite file in `apps/web/` is for local dev only — never commit
changes to it.

## Conventions

- **Server vs client components**: default to server components; only add
  `"use client"` when the file needs hooks, browser-only APIs, or event
  handlers. See `app/(dashboard)/` for the established pattern.
- **UI primitives come from shadcn/ui** (`components/ui/`). Do not introduce
  other UI libraries. If a primitive is missing, run the shadcn CLI to add it.
- **No `any`, no `@ts-ignore`, no `@ts-expect-error`.**
- **Tailwind**: use the existing `tailwind.config.ts` design tokens. Do not add
  raw hex colors inline.
- **Auth**: session is owned by better-auth — see [`lib/`](lib/) for the
  configured client. Do not roll a new auth flow.

## Verify before committing

```bash
pnpm --filter web test -- --run
pnpm --filter web build
```

## Tests

### Location

Tests live next to source as `<name>.test.ts(x)`. Examples:
[`formatters.test.ts`](src/lib/formatters.test.ts) (node environment),
[`currency-context.test.tsx`](src/lib/currency-context.test.tsx) (jsdom + SSR).

### Running

```bash
pnpm --filter web test -- --run                                         # one-shot
pnpm --filter web test -- --run --coverage --coverage.reporter=text     # coverage
pnpm --filter web test                                                  # watch
```

### Environment split

[`vitest.config.mjs`](vitest.config.mjs) defines two projects:
- **node**: `src/lib/**`, `src/styles/**` — fast, no DOM.
- **jsdom**: `src/components/**`, `app/**` — DOM via `@testing-library/react`.

Override per-file with `// @vitest-environment <name>` pragma.

### SSR hydration pattern

Client-side context providers backed by browser-only APIs (`localStorage`,
`window`, `document`) must use the `mounted` flag pattern. Naive lazy-init
`useState(() => readBrowserAPI())` breaks SSR because those globals don't
exist during server rendering. The contracts in
[`currency-context.test.tsx`](src/lib/currency-context.test.tsx) and
[`tweaks-context.test.tsx`](src/lib/tweaks-context.test.tsx) pin this — any
refactor that breaks them is breaking SSR safety.

### Lint caveat

`pnpm --filter web lint` has 3 pre-existing react-hooks errors in
`currency-context.tsx`, `tweaks-context.tsx`, and `donut.tsx`. These are
intentionally left unfixed (#35, see #6 discussion). Do not "fix" them with
lazy-init — see the SSR section above.
