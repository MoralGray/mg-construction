# mg-construction-journal

Monorepo for a construction work log journal — foremen record daily work on
construction objects (roads). React 19 frontend, NestJS 11 backend, SQLite
(dev) / PostgreSQL (prod), Prisma ORM, shadcn/ui, TanStack Table, Docker.

## Features

Journal table with add/edit/delete entries, server-side filtering (date range,
work type, volume, full-text search), road management with toggle filtering,
entry detail modal with cross-road task grouping (topicId).

## Quick Start

### Local development (SQLite)

```bash
npm install
npx nx run mg-construction-journal-backend:dev
npx nx run mg-construction-journal:dev
```
or
```bash
mise run dev-all
```

### Docker (PostgreSQL, production-like)

```bash
docker compose up --build -d
```

Services:
- **Frontend** → http://localhost:3002
- **Backend** → http://localhost:8001
- **PostgreSQL** → localhost:5432

Build modes:
- **Fast** (`docker compose build`) — uses npm cache mount, ~20s on cache hit
- **Clean** (`docker compose build --no-cache && docker builder prune --filter type=exec.cachemount -f`) — full rebuild, ~8 min

See [**DOCS.md §3.10**](./DOCS.md#310-docker) for detailed Docker architecture.

## Documentation

[**DOCS.md**](./DOCS.md) — exhaustive reference covering all backend modules,
frontend components, library packages, data flows, seed scripts, config files,
Docker build, and test plan.

[`docs/`](./docs/) — guides for creating projects, libraries, and integrating
the UI library.

## Mock Data

On first start, the database seeds automatically — idempotent, skips if roads
already exist:

- **6 roads** — named after real Moscow highways
- **10 work types** — concrete, asphalt, marking, barriers, etc.
- **1000 work log entries** — across 2024–2025 with realistic volumes and executors

Seed scripts: [`prisma/seed.ts`](./apps/mg-construction-journal-backend/prisma/seed.ts)
and [`prisma/seed-data.ts`](./apps/mg-construction-journal-backend/prisma/seed-data.ts).

### Mise commands

| Action | Run |
|---|---|
| Add roads & work types | `mise run seed` |
| Add 1000 mock entries | `mise run seed-mock` |
| Remove all entries | `mise run seed-clear` |
