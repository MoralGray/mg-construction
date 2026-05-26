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

First time setup:

1. Create a `.env` file in `apps/mg-construction-journal-backend/`:
   ```bash
   echo 'DATABASE_URL=file:./prisma/dev.db
   DB_PROVIDER=sqlite' > apps/mg-construction-journal-backend/.env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start both apps (generates Prisma client, pushes schema, starts backend on :8001 and frontend on :3002):
   ```bash
   mise run dev-all
   ```

4. In a separate terminal, seed roads, work types, and mock entries (optional):
   ```bash
   npx nx run mg-construction-journal-backend:seed
   npx nx run mg-construction-journal-backend:seed-mock
   ```

The dev script runs `prisma generate && prisma db push && tsx watch src/main.ts` — the Prisma client and database are set up automatically on first start.

To switch to PostgreSQL, edit `apps/mg-construction-journal-backend/.env` and update `schema.prisma` provider to `postgresql`.

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
- **100 work log entries** — across 2024–2026 with realistic volumes and executors

Seed scripts: [`prisma/seed.ts`](./apps/mg-construction-journal-backend/prisma/seed.ts)
and [`prisma/seed-data.ts`](./apps/mg-construction-journal-backend/prisma/seed-data.ts).

### Mise commands

| Action | Run |
|---|---|
| Add roads & work types | `mise run seed` |
| Add 1000 mock entries | `mise run seed-mock` |
| Remove all entries | `mise run seed-clear` |
