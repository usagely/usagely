<div align="center">

# Usagely

**FinOps-for-AI platform** — monitor, control, and optimize your organization's spending on AI tools and LLM services.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](LICENSE)
[![Discord](https://img.shields.io/discord/vkqcKrYr?color=5865F2&label=Discord)](https://discord.gg/vkqcKrYr)

[Getting Started](#getting-started) · [Features](#features) · [Tech Stack](#tech-stack) · [Contributing](#contributing) · [License](#license)

</div>

---

AI spend is the fastest-growing uncontrolled cost in tech companies. Teams track it in spreadsheets, finance has zero visibility, and developers adopt tools individually without oversight. Usagely fixes this.

It's the **open-source FinOps platform built specifically for AI** — self-hostable, integrates with your AI providers, and gives every team a single pane of glass to understand, control, and optimize AI spending.

## Features

| Feature | Description |
|---|---|
| **Spend Dashboard** | Daily totals, per-tool, per-model, and per-user cost breakdown |
| **Budget Management** | Monthly/quarterly budgets with alert thresholds by team or scope |
| **Anomaly Detection** | Automatic flagging of unusual spend spikes or budget overruns |
| **Savings Recommendations** | Confidence-scored suggestions to reduce AI costs |
| **Shadow AI Detection** | Identifies unapproved tools discovered via expenses, SSO logs, or network |
| **Approval Workflow** | Request and approve/deny access to new AI tools |
| **Model Usage Tracking** | Token-level metrics (tokens in/out, calls, latency, cost) per LLM model |
| **Multi-tenant** | Every resource is org-scoped; supports multiple organizations |
| **OSS + EE split** | Core features are open source; enterprise features live in `/ee` |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, TailwindCSS 4, shadcn/ui |
| Backend | Go 1.25, chi v5 router |
| Database | PostgreSQL (pgx v5 driver, golang-migrate, SQLC) |
| Auth | better-auth (frontend), JWT (backend) |
| Monorepo | Turborepo + pnpm workspaces |

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Go | 1.25+ |
| Node.js | 20+ |
| pnpm | 9.x |
| PostgreSQL | 15+ |

### Quick Start

```bash
git clone https://github.com/usagely/usagely.git
cd usagely
cp .env.example .env

# Install frontend dependencies
pnpm install

# Set up the database
make migrate

# (Optional) Seed with sample data
make seed

# Start development servers
make dev
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8080
- **Health check**: http://localhost:8080/healthz

### Environment Variables

**`/.env`**
```env
DATABASE_URL=postgres://user:password@localhost:5432/usagely_db
PORT=8080
JWT_SECRET=change-me-in-production
CORS_ORIGIN=http://localhost:3000
EDITION=oss
```

**`/apps/web/.env.local`**
```env
AUTH_SECRET=dev-secret-change-me
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Project Structure

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
│   │   ├── db/           # PostgreSQL connection pool
│   │   ├── handler/      # HTTP handlers
│   │   └── middleware/   # RequestID, Logger, Recovery, CORS
│   ├── migrations/       # SQL migration files
│   └── sqlc.yaml         # SQLC code-gen config
├── ee/
│   ├── server/           # Enterprise backend extensions
│   └── web/              # Enterprise frontend extensions
├── design/               # Design assets
├── Makefile
├── turbo.json
└── pnpm-workspace.yaml
```

## Contributing

We welcome contributions! Here's how to get started:

1. Check [Good First Issues](https://github.com/usagely/usagely/labels/good%20first%20issue) for beginner-friendly tasks
2. Read our contributing guidelines (coming soon)
3. Fork the repo, create a feature branch, and submit a PR

Join our [Discord](https://discord.gg/vkqcKrYr) for discussions and support.

## License

Usagely is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

- **OSS Edition** (this repo): AGPL-3.0 — free to use, modify, and self-host
- **Enterprise Edition** (`/ee`): Commercial license — see [usagely.io/license](https://usagely.io/license)

```
Usagely — FinOps-for-AI platform
Copyright (C) 2026 Usagely Contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```
