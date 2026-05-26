# mg-construction-journal — Complete Documentation

## # ==========================================================================
## # 1. Project Overview
## # ==========================================================================

Monorepo `mg-construction-journal` — a construction site work log journal.
Foremen record daily work: what was done (work type), how much (volume + unit),
who did it (executor), on which road (construction object), with status tracking
(done/in-progress/stopped) and cross-road task grouping (topicId).

### Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 19 + TypeScript 5.9 + Vite 8 | Modern buildless dev, fast HMR |
| Backend | NestJS 11 + TypeScript | Structured module system, DI, validation pipes |
| Database ORM | Prisma 7 | Type-safe queries, schema migrations, dual adapter |
| Database (dev) | SQLite via better-sqlite3 | Zero setup, file-based |
| Database (prod) | PostgreSQL 16 | Production-grade relational DB |
| UI | shadcn/ui (55+ components) + Tailwind CSS v4 | Accessible, customizable, utility-first styling |
| Table | TanStack Table (react-table v8) | Headless table with sorting, pagination, virtualization |
| Forms | Zod + custom Form wrapper | Type-safe validation with schema inference |
| State | Zustand | Lightweight, no boilerplate, persist to localStorage |
| HTTP Client | Axios + custom wrapper (mg-api-axios-1) | Interceptors, typed endpoints |
| Data Fetching | TanStack React Query | Caching, pagination, background refetch |
| Linting/Formatting | Biome 2 | Fast single-tool formatter + linter |
| Monorepo | Nx 22 | Task orchestration, caching, dependency graph |
| Containerization | Docker + docker-compose | PostgreSQL + backend + nginx frontend |

### Monorepo Layout

```
/
 apps/
   mg-construction-journal/           — React SPA (port 3002)
   mg-construction-journal-backend/   — NestJS API (port 8001)
 packages/
   mg-api-axios-1        (@mg-nx-forge/mg-api-axios-1)        — Axios API client
   mg-infinite-view-tanstack  (@mg-nx-forge/mg-infinite-view-tanstack) — Infinite scroll hook
   mg-router-zustand-1  (@mg-nx-forge/mg-router-zustand-1)   — Router state + redirect
   mg-table-tanstack    (@mg-nx-forge/mg-table-tanstack)     — TanStack Table wrapper
   mg-ui-shadcn-4       (@mg-nx-forge/mg-ui-shadcn-4)        — 55+ shadcn/ui components
```

Apps reference packages via `path.resolve` aliases in `vite.config.ts` (source-level
resolution). Nx paths in `tsconfig.base.json` for IDE support.

### Ports (configured in mise.toml)

| Variable | App | Port |
|----------|-----|------|
| `MG_CONSTRUCTION_JOURNAL_PORT` | mg-construction-journal | 3002 |
| `MG_CONSTRUCTION_JOURNAL_BACKEND_PORT` | mg-construction-journal-backend | 8001 |

### Origin Story

The project was repurposed from a newspaper RSS reader (`mg-newspaper`). Legacy
entities were mapped to the construction domain:

| Old (Newspaper) | New (Construction Journal) |
|-----------------|---------------------------|
| Source (BBC, NYT) | Road — construction object |
| Article (news item) | WorkLogEntry — work record |
| Source category (left/right/neutral) | Road category (highway/urban/bridge/tunnel/other) |
| News topicId | Cross-road work task identifier |
| ArticleDetailModal | WorkLogDetailModal — entry details |
| SourceDetailModal | RoadDetailModal — road info |
| NewspaperGrid (homepage) | DataTable (TanStack) with entries |
| SourcesTab (settings) | RoadsTab — road management |

---

## # ==========================================================================
## # 2. Architecture
## # ==========================================================================

### Data Flow (end-to-end)

```
User Action (click, form submit)
  → React Component (event handler)
    → API call (api.service.ts → mg-api-axios-1 → Axios → HTTP)
      → NestJS Controller (validation via ValidationPipe + DTOs)
        → Service (business logic)
          → Prisma Client (type-safe query)
            → SQLite / PostgreSQL
          ← query result
        ← response entity
      ← HTTP response
    ← typed data
  → Store update (Zustand) / setState
  → Re-render (React)
```

### API Communication

All API calls go through `mg-api-axios-1` `ApiClient`:

```
constructor: ApiClient('/api')  → axios instance with baseURL '/api'
.createApi({ workLog: 'work-log', ... }) → { workLog: { get, post, put, del } }
```

In dev, Vite proxies `/api` to `http://localhost:8001/api` (configured in vite.config.ts).

### Authentication

- JWT-based auth via `@nestjs/jwt` + `@nestjs/passport`
- Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (guarded)
- Passwords hashed with bcryptjs (10 rounds)
- Token expires in 7 days
- **Note**: 16 of 17 API endpoints are public — auth is scaffolded but most routes
  (work-log, work-types, roads) have no guards. Only `GET /api/auth/me` is protected.

---

## # ==========================================================================
## # 3. Backend — apps/mg-construction-journal-backend
## # ==========================================================================

### # ------------------------------------------------------------------
### # 3.1 Prisma Schema — prisma/schema.prisma
### # ------------------------------------------------------------------

8 models. Two datasources configured via `DB_PROVIDER` env var (sqlite | postgresql).
Prisma client generated to `src/generated/prisma/`.

#### User

| Field | Type | Notes |
|-------|------|-------|
| id | String @id @default(uuid()) | UUID primary key |
| email | String @unique | Login identifier |
| name | String? | Display name |
| passwordHash | String | bcrypt hash |
| role | String @default("user") | Role-based access (unused) |
| plan | String? | Pricing plan (unused) |
| openAiKey | String? | Legacy (unused) |
| websearchKey | String? | Legacy (unused) |
| createdAt | DateTime @default(now()) | Auto timestamp |
| updatedAt | DateTime @updatedAt | Auto timestamp |

Relations:
- `User → UserSource[]` — many-to-many with Source
- `User → AiUsage[]` — AI usage logs (legacy)
- `User → ApiLog[]` — API request logs (legacy)
- `UserSource` — join table with `enabled` flag

#### Source (legacy — kept for backward compatibility)

| Field | Type | Notes |
|-------|------|-------|
| id | String @id | e.g. "bbc", "nytimes" |
| slug | String @unique | URL-friendly name |
| name | String | Display name |
| feedUrl | String | RSS feed URL |
| logoUrl | String? | Brand logo |
| bias | String @default("neutral") | left/right/neutral |
| popularity | Int @default(1) | Sort weight |
| isDefault | Boolean @default(true) | Pre-enabled |

#### Article (legacy — kept for backward compatibility)

| Field | Type | Notes |
|-------|------|-------|
| id | Int @id @default(autoincrement()) | Auto-increment PK |
| title | String | Article headline |
| description | String | Summary |
| content | String | Full text |
| url | String? | Original URL |
| category | String | Topic category |
| popularity | Int @default(0) | Engagement score |
| date | String | Publication date (ISO string) |
| topicId | Int? | Cross-article grouping |
| fetchedAt | DateTime @default(now()) | When scraped |
| sourceId | String | FK → Source |

#### Road (repurposed Source)

| Field | Type | Notes |
|-------|------|-------|
| id | Int @id @default(autoincrement()) | Auto-increment PK |
| name | String | Display name (e.g. "M4 Don") |
| slug | String @unique | URL-friendly (e.g. "m4-don") |
| roadType | String @default("highway") | highway/urban/bridge/tunnel/other |
| description | String? | Free-text notes |
| createdAt | DateTime @default(now()) | Auto timestamp |

Relations:
- `Road → WorkLogEntry[]` — all entries logged against this road

#### WorkType

| Field | Type | Notes |
|-------|------|-------|
| id | Int @id @default(autoincrement()) | Auto-increment PK |
| slug | String @unique | URL-friendly (e.g. "kladka-peregorodok") |
| name | String | Display name (e.g. "Кладка перегородок") |
| unit | String | Measurement unit (e.g. "м³", "м²", "т", "шт", "м") |

Relations:
- `WorkType → WorkLogEntry[]` — all entries of this work type

#### WorkLogEntry (core entity)

| Field | Type | Notes |
|-------|------|-------|
| id | Int @id @default(autoincrement()) | Auto-increment PK |
| date | DateTime | When work was performed (date only, time discarded) |
| workTypeId | Int | FK → WorkType.id |
| roadId | Int | FK → Road.id |
| volume | Float | Quantity of work done |
| executorName | String | Full name of the foreman/worker |
| description | String? | Free-text notes about the work |
| topicId | Int? | Cross-road task grouping ID (30% of mock data has topicId=1, 10% has 2) |
| workDone | Boolean @default(false) | Status: completed |
| workInProgress | Boolean @default(false) | Status: in progress |
| workStopped | Boolean @default(false) | Status: halted |
| createdAt | DateTime @default(now()) | Record creation timestamp |
| updatedAt | DateTime @updatedAt | Last update timestamp |

Relations:
- `WorkLogEntry → WorkType` (required)
- `WorkLogEntry → Road` (required)

#### AiUsage & ApiLog (legacy models)

Kept for backward compatibility with existing seed data. Unused by the
construction journal feature set.

### # ------------------------------------------------------------------
### # 3.2 PrismaService — src/prisma/prisma.service.ts
### # ------------------------------------------------------------------

`@Global()` module (`PrismaModule`). Injects into any service without explicit import.

Dual-adapter pattern:
```typescript
if (provider === 'postgresql') {
    adapter = new PrismaPg({ connectionString: url });
} else {
    adapter = new PrismaBetterSqlite3({ url });
}
this.prisma = new PrismaClient({ adapter });
```

- SQLite: `file:./prisma/dev.db` (default)
- PostgreSQL: `DATABASE_URL` env var (e.g. `postgresql://user:password@postgres:5432/mg-construction-journal?schema=public`)

### # ------------------------------------------------------------------
### # 3.3 WorkLogModule — src/work-log/
### # ------------------------------------------------------------------

#### WorkLogController — 6 endpoints

```
POST   /api/work-log              → create(dto)          → 201: WorkLogEntryItem
GET    /api/work-log               → findAll(query)       → 200: PaginatedResponse<WorkLogEntryItem>
GET    /api/work-log/:id           → findOne(id)          → 200: WorkLogEntryItem | 404
PUT    /api/work-log/:id           → update(id, dto)      → 200: WorkLogEntryItem | 404
DELETE /api/work-log/:id           → delete(id)           → 200: { deleted: true } | 404
GET    /api/work-log/:id/related   → getRelated(id)       → 200: WorkLogEntryItem[] | 404
```

`ValidationPipe` with `{ transform: true, whitelist: true }` auto-transforms
query/body params to DTO types and strips unknown fields.

#### WorkLogService

**create(dto: CreateWorkLogEntryDto)**:
- Converts `dto.date` string to `new Date(dto.date)`
- Null-coalesces optional fields (description, topicId → null, workDone/InProgress/Stopped → false)
- Includes workType and road relations
- Returns flat `WorkLogEntryItem` via private `toItem()` mapper

**findAll(query: WorkLogQueryDto)**:
Pagination + multi-filter query. Defaults: `page=0`, `limit=20`, `sort='date_desc'`.

Filter pipeline (each condition is additive, AND logic):

| Param | Prisma `where` | Behavior |
|-------|---------------|----------|
| dateFrom | `date.gte` | Greater-than-or-equal |
| dateTo | `date.lte` | Less-than-or-equal |
| roadId | `roadId.equals` | Exact match (single) |
| roadIds | `roadId.in` | CSV → array of Ints (multi-select) |
| workTypeId | `workTypeId.equals` | Exact match (single) |
| workTypeIds | `workTypeId.in` | CSV → array of Ints (multi-select) |
| volumeFrom | `volume.gte` | Minimum volume |
| volumeTo | `volume.lte` | Maximum volume |
| search | `OR: [{executorName contains}, {workType.name contains}, {road.name contains}]` | Text search across 3 fields |

Pagination: `skip = page * limit`, `take = limit`. Total pages = `ceil(total / limit)`.

Returns `PaginatedResponse<WorkLogEntryItem>`:
```typescript
{ data: WorkLogEntryItem[], total: number, page: number, totalPages: number }
```

**findOne(id)**:
- `findUnique` with workType + road includes
- Returns `undefined` if not found → Controller throws 404

**update(id, dto: UpdateWorkLogEntryDto)**:
- Partial update — only sets fields present in DTO
- Checks existence first, returns `undefined` if not found
- Preserves existing values for omitted fields

**delete(id)**:
- Checks existence, returns `false` if not found
- `delete({ where: { id } })` for removal

**getRelated(id)**:
- Finds entry by id, checks if it has `topicId`
- If has topicId: finds all other entries with same topicId (excluding self)
- If no topicId: returns empty array []

#### DTOs (src/work-log/work-log.dto.ts)

**CreateWorkLogEntryDto**:
```typescript
date:          string      @IsDateString()             — Required
workTypeId:    number      @Type(() => Number) @IsInt() — Required
roadId:        number      @Type(() => Number) @IsInt() — Required
volume:        number      @Type(() => Number) @Min(0)  — Required
executorName:  string      @IsString()                  — Required
description?:  string      @IsOptional() @IsString()    — Optional
topicId?:      number      @Type(() => Number) @IsOptional() @IsInt() — Optional
workDone?:     boolean     @IsOptional()                — Optional, defaults false
workInProgress?: boolean   @IsOptional()                — Optional, defaults false
workStopped?:  boolean     @IsOptional()                — Optional, defaults false
```

**UpdateWorkLogEntryDto**: Same fields, all `@IsOptional()`.

**WorkLogQueryDto** — 12 query params:
```typescript
dateFrom?:    string   @IsDateString()
dateTo?:      string   @IsDateString()
roadId?:      number   @Type(() => Number) @IsInt()
workTypeId?:  number   @Type(() => Number) @IsInt()
sort?:        'date_desc' | 'date_asc'  @IsString()
workTypeIds?: string   @IsString()      — comma-separated
search?:      string   @IsString()
volumeFrom?:  number   @Type(() => Number) @Min(0)
volumeTo?:    number   @Type(() => Number) @Min(0)
roadIds?:     string   @IsString()      — comma-separated
page?:        number   @Type(() => Number) @IsInt() @Min(0)
limit?:       number   @Type(() => Number) @IsInt() @Min(1)
```

**WorkLogEntryItem** (src/work-log/work-log.entity.ts):
```typescript
interface WorkLogEntryItem {
    id: number;
    date: string;                    // ISO date only (YYYY-MM-DD)
    workTypeId: number;
    workTypeName: string;            // Denormalized from relation
    workTypeUnit: string;            // Denormalized from relation
    roadId: number;
    roadName: string;                // Denormalized from relation
    volume: number;
    executorName: string;
    description?: string;
    topicId?: number;
    workDone: boolean;
    workInProgress: boolean;
    workStopped: boolean;
    createdAt: string;               // ISO datetime
    updatedAt: string;               // ISO datetime
}
```

The `toItem()` private method maps Prisma result to flat interface:
- `date.toISOString().split('T')[0]` — strips time, keeps only date part
- `entry.workType.name` → `workTypeName`
- `entry.workType.unit` → `workTypeUnit`
- `entry.road.name` → `roadName`

#### PaginatedResponse<T>
```typescript
interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
}
```

### # ------------------------------------------------------------------
### # 3.4 WorkTypeModule — src/work-type/
### # ------------------------------------------------------------------

Simple read-only reference data.

```
GET /api/work-types → { data: WorkTypeItem[] }
```

**WorkTypeItem**:
```typescript
{ id: number, slug: string, name: string, unit: string }
```

Service: `prisma.workType.findMany({ orderBy: { id: 'asc' } })`.

10 seed work types (Russian-language):
1. Кладка перегородок (м³)
2. Монтаж опалубки (м²)
3. Бетонирование (м³)
4. Монтаж арматуры (т)
5. Штукатурка (м²)
6. Покраска (м²)
7. Монтаж электропроводки (м)
8. Укладка плитки (м²)
9. Монтаж окон (шт)
10. Кровля (м²)

### # ------------------------------------------------------------------
### # 3.5 RoadModule — src/road/
### # ------------------------------------------------------------------

```
GET /api/roads      → { data: RoadItem[] }
GET /api/roads/:id  → RoadItem | 404
```

**RoadItem**:
```typescript
{ id: number, name: string, slug: string, roadType: string, description?: string }
```

Service: `prisma.road.findMany({ orderBy: { name: 'asc' } })`.

6 seed roads:
1. M4 Don (highway) — Federal highway Moscow-Novorossiysk
2. M7 Volga (highway) — Moscow-Ufa
3. M8 Kholmogory (highway) — Moscow-Arkhangelsk
4. R22 Caspian (highway) — Volgograd-Astrakhan
5. Urban Street A (urban) — City street reconstruction
6. Bridge Overpass 1 (bridge) — Bridge overpass at km 45

### # ------------------------------------------------------------------
### # 3.6 AuthModule — src/auth/
### # ------------------------------------------------------------------

JWT-based auth scaffold. Notes:
- `JWT_SECRET` env var (falls back to hardcoded dev secret)
- 7-day token expiry
- `@UseGuards(JwtAuthGuard)` on `GET /api/auth/me`
- Register: validates uniqueness of email, hashes password with bcryptjs
- Login: verifies email + password, returns JWT
- Profile: returns user sans passwordHash

AuthResponse shape:
```typescript
{
    accessToken: string;
    user: { id: string; email: string; name: string | null; role: string };
}
```

### # ------------------------------------------------------------------
### # 3.7 Seed Scripts — src/seed/
### # ------------------------------------------------------------------

#### seed.ts — Base data
- Connected to Prisma with dual adapter
- Clears all tables in FK-safe order
- Seeds: 7 legacy Sources, ~170 legacy Articles (from mock-news.json), 10 WorkTypes, 6 Roads
- Run via: `nx run mg-construction-journal-backend:seed` or `mise run seed`

#### mock-entries.ts — 1000 mock work log entries
- Requires roads + work types to exist (run seed first)
- Generates entries with random:
  - Dates: 2025-01-01 to 2026-06-30
  - Road/WorkType: random pairings from existing data
  - Volume: 1-500 (random integer)
  - Executor names: from pool of 50 Russian names
  - Descriptions: 20 variants (Russian)
  - TopicId: 30% get 1, 10% get 2, rest null
  - Status: 30% workDone, 20% workInProgress, 10% workStopped (non-exclusive)
- Uses `prisma.workLogEntry.createMany()` for bulk insert
- Run via: `nx run mg-construction-journal-backend:seed-mock` or `mise run seed-mock`

#### clear-entries.ts — Clear all entries
- Interactive confirmation prompt (`Are you sure? (yes/no)`)
- `prisma.workLogEntry.deleteMany()` — does NOT affect roads, work types, or legacy tables
- Reports remaining road + work type count after clear
- Run via: `nx run mg-construction-journal-backend:seed-clear` or `mise run seed-clear`

### # ------------------------------------------------------------------
### # 3.8 Docker
### # ------------------------------------------------------------------

The project runs in Docker with three services defined in `docker-compose.yml`.

#### Services

| Service | Image/Base | Port (host) | Purpose |
|---------|-----------|-------------|---------|
| postgres | postgres:16-alpine | 5432 | Database (PostgreSQL) |
| backend | node:22.14.0-alpine | 8001 | NestJS API |
| frontend | nginx:alpine | 3002 | Vite-built SPA |

#### Backend Dockerfile (`apps/mg-construction-journal-backend/Dockerfile`)

**Multi-stage build**:

1. **builder** — Installs all workspace deps via `npm ci --include-workspace-root`.
   Uses BuildKit cache mount (`--mount=type=cache,target=/root/.npm`) to persist
   the npm cache across builds — subsequent builds skip re-downloading packages
   (~20s when cached vs ~8 min on clean build).

2. Patches `prisma/schema.prisma` with `sed` to replace `provider = "sqlite"` with
   `"postgresql"` — the schema file stays as `sqlite` on the host for local dev.

3. Generates Prisma Client against the patched schema.

4. **runner** — Copies `node_modules`, `apps/`, `packages/`, and `package.json`.
   Sets `DB_PROVIDER=postgresql` and `TSX_TSCONFIG_PATH=tsconfig.docker.json`
   (a minimal tsconfig with `experimentalDecorators: true` for NestJS decorators).

5. **CMD** runs three commands sequentially:
   ```
   prisma db push        → creates/updates PostgreSQL tables
   npx tsx seed-docker   → seeds roads + work types + 1000 mock entries (only if DB empty)
   npx tsx main.ts       → starts NestJS
   ```

**Provider switching** (Docker vs local dev):

| Environment | schema.prisma provider | DB_PROVIDER | DATABASE_URL |
|-------------|----------------------|-------------|--------------|
| Docker | patched to `postgresql` at build time | `postgresql` | `postgresql://user:password@postgres:5432/mg-construction-journal?schema=public` |
| Local dev | `sqlite` (unchanged) | not set (defaults to `sqlite`) | `file:./prisma/dev.db` |

The `sed -i 's/provider = "sqlite"/provider = "postgresql"/'` in the Dockerfile
patches the schema file inside the image at build time. The original file on
disk is never modified.

#### Frontend Dockerfile (`apps/mg-construction-journal/Dockerfile`)

**Multi-stage build**:

1. **builder** — Installs workspace deps via `npm ci` (shares npm cache mount).
   Copies `tsconfig.base.json` (needed by `mg-ui-shadcn-4` which extends it).
   Runs `npm run build -w mg-construction-journal` (tsc + Vite build).

2. **runner** — nginx:alpine with custom `nginx.conf` that handles SPA routing
   (falls through to `index.html` for unknown paths) and proxies `/api/` requests
   to the backend service.

#### Auto-seeding on startup

The `seed-docker.ts` script runs at container startup:

```typescript
const roadCount = await prisma.road.count();
if (roadCount > 0) {
    // Database already has data — skip
    return;
}
// First run — seed roads, work types, and 1000 mock entries
```

**Idempotent**: data persists in the PostgreSQL volume across restarts. Seeding
only happens on the very first start with an empty database.

**Seed data**:
- 6 federal/city roads (M4 Don, M7 Volga, M8 Kholmogory, R22 Caspian, Urban A, Bridge 1)
- 10 construction work types (кладка перегородок, монтаж опалубки, бетонирование, etc.)
- 1000 random work log entries with:
  - Dates from 2025-01-01 to 2026-06-30
  - Random road/work-type pairings
  - Volumes 1-500
  - 50 Russian-language executor names
  - 20 description variants
  - 30% get topicId=1, 10% get topicId=2 (cross-road task grouping)
  - 30% workDone, 20% workInProgress, 10% workStopped

#### Build Performance

| Scenario | Command | Time |
|----------|---------|------|
| First build (no cache) | `docker compose build --no-cache` | ~8 min |
| Subsequent (deps unchanged) | `docker compose build` | ~0s (Docker layer cache) |
| Deps changed | `docker compose build` | ~20s (npm cache mount hit) |
| Clean rebuild | `docker builder prune --filter type=exec.cachemount -f && docker compose build --no-cache` | ~8 min |

The npm cache mount (`--mount=type=cache,target=/root/.npm`) persists the
`/root/.npm` directory across builds. Even when `package-lock.json` changes
and the `npm ci` layer is invalidated, npm finds already-downloaded packages
in the cache and only fetches diffs.

#### Troubleshooting

**Backend fails with "datasource.url property is required"**:
The `prisma.config.ts` uses `DATABASE_URL` env var. Ensure `DATABASE_URL` is
set in `docker-compose.yml` environment. The CMD `cd`s into the backend
directory so prisma finds the config file.

**Frontend shows "502 Bad Gateway"**:
nginx can't reach the backend. Check `docker compose logs backend` — the
backend likely crashed during startup (missing env vars, Prisma error, or
decorator config).

**Backend fails with "Tsconfig not found"**:
tsx needs `experimentalDecorators: true`. The Dockerfile sets
`TSX_TSCONFIG_PATH=tsconfig.docker.json` — a minimal tsconfig with the
required settings. Ensure the file is copied into the image.

**PostgreSQL connection refused**:
The backend starts before Postgres is ready. `docker-compose.yml` has
`depends_on: postgres: condition: service_healthy` with `pg_isready`
healthcheck. If Postgres takes too long, restart the backend container:
`docker compose restart backend`.

**Docker network error "all predefined address pools have been fully subnetted"**:
Run `docker network prune` to remove unused networks, then retry.

### # ------------------------------------------------------------------
### # 3.9 Legacy modules (kept for compat)
### # ------------------------------------------------------------------

- `src/news/news.controller.ts` + `src/news/news.service.ts` — Article CRUD
- `src/sources/sources.controller.ts` + `src/sources/sources.service.ts` — Source CRUD

These are registered in `AppModule` but no frontend pages use them anymore.
The legacy tables (Source, Article, AiUsage, ApiLog, UserSource) and their
endpoints remain operational but are not part of the construction journal feature.

---

## # ==========================================================================
## # 4. Frontend — apps/mg-construction-journal
## # ==========================================================================

### # ------------------------------------------------------------------
### # 4.1 Entry Point — main.tsx
### # ------------------------------------------------------------------

```tsx
<StrictMode>
  <QueryProvider>          // TanStack React Query client
    <BrowserRouter>        // React Router v6+
      <App />
    </BrowserRouter>
  </QueryProvider>
</StrictMode>
```

`QueryProvider` (from mg-infinite-view-tanstack) creates a `QueryClient` with:
- `staleTime: 30_000` (30s)
- `retry: 2`
- `refetchOnWindowFocus: false`

### # ------------------------------------------------------------------
### # 4.2 App — App.tsx
### # ------------------------------------------------------------------

```tsx
<ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
  <TooltipProvider>        // Radix tooltip context
    <Header />             // Navigation + mode toggle
    <Toaster richColors position="top-right" />  // Sonner toast notifications
    <Suspense fallback={Masthead + HomePageSkeleton}>
      <Routes>
        {pagesInfo.map(page => <Route path={page.url} element={<Component />} />}
      </Routes>
    </Suspense>
  </TooltipProvider>
  <ClickSpark />           // Cursor spark effect
</ThemeProvider>
```

Pages are lazy-loaded via `React.lazy()`:
- `/` → HomePage (Journal/Work Log table)
- `/settings` → SettingsPage (Roads management)

### # ------------------------------------------------------------------
### # 4.3 Routing — pages.service.ts
### # ------------------------------------------------------------------

```typescript
export const homePage: PageEntity = { title: 'Journal', desk: 'Work log', url: '/' };
export const settingsPage: PageEntity = { title: 'Roads', desk: 'Manage roads', url: '/settings' };
```

Uses `@mg-nx-forge/mg-router-zustand-1` for page state:
- `initializeCurrentPage(pagesInfo)` — on mount, syncs URL to Zustand store
- `useRouterStorage()` — `currentPage` state
- `useRedirect()` — `redirect(page)` for navigation
- `console.log('page', page)` on every navigation (legacy, kept)

### # ------------------------------------------------------------------
### # 4.4 Components
### # ------------------------------------------------------------------

#### Header (src/components/Header.tsx)

```
[MG Construction Journal]    [Journal] [Roads] [🌙]
```

- Nav buttons for each page (Journal, Roads)
- Current page gets `underline` class
- `ModeToggle` component for light/dark/system theme
- Uses `useRedirect` + `useRouterStorage` from mg-router-zustand-1

#### Masthead (src/components/Masthead.tsx)

```
─────────────────────────────────────────────
        CONSTRUCTION JOURNAL
    EST. 2026  |  Monday, May 25, 2026
─────────────────────────────────────────────
```

- Serif font, large centered title
- Dynamic date in `Weekday, Month Day, Year` format
- `children` prop for action buttons (New Entry, Filter)

#### HomePageSkeleton (src/components/HomePageSkeleton.tsx)

- CSS grid (3 columns × 2 rows) with pulse animation
- 6 card-shaped skeleton blocks
- Used as Suspense fallback for lazy-loaded pages

#### WorkLogEntryFormDialog (src/components/WorkLogEntryFormDialog.tsx)

Dialog form for creating/editing work log entries.

**Props**:
```typescript
{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;        // called after create/update
    entry?: WorkLogEntry | null;  // null = create mode, value = edit mode
}
```

**Fields**:
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| date | date input | z.string().min(1) | Required |
| workTypeId | select | z.string().min(1) | Loaded from API, label shows name + unit |
| roadId | select | z.string().min(1) | Loaded from API |
| volume | number input | z.string().refine(v => !isNaN && > 0) | Step "any" for decimals |
| executorName | text input | z.string().min(1) | Required |
| description | textarea | z.string().optional() | 3 rows |
| topicId | number input | z.coerce.number().int().optional() | Optional task group ID |
| workDone | checkbox | z.boolean() | Status flags (non-exclusive) |
| workInProgress | checkbox | z.boolean() | Status flags |
| workStopped | checkbox | z.boolean() | Status flags |

**Flow**:
1. On open: fetches work types + roads from API (with loading state)
2. Pre-populates all fields in edit mode, empty defaults in create mode
3. On submit: Zod validation → `createWorkLogEntry()` or `updateWorkLogEntry()`
4. On success: closes dialog, shows success toast, calls `onSuccess()`
5. On error: shows error toast

#### WorkLogDetailModal (src/components/WorkLogDetailModal.tsx)

Full-screen dialog showing entry details + related entries.

**Props**:
```typescript
{
    entry: WorkLogEntry | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEntryClick?: (id: number) => void;
    onRelatedEntriesFetched?: (entries: WorkLogEntry[]) => void;
}
```

**Header section**:
- Work type name | date | road name
- Title: `{volume} {unit} — {executorName}`
- Description text (or "No additional details.")
- Status badges (Done/In Progress/Stopped) with color coding

**Related entries section** (only if `topicId` exists):
- Header: "Related entries — Task #{topicId} (N)"
- Search input for client-side filtering of related entries
- ScrollArea with related entry cards (roadName, volume, unit, executorName, date)
- Loading spinner while fetching
- Empty states: "No other entries for this task." / "No matching entries."
- Clicking a related entry calls `onEntryClick(id)`

**Fetch logic**: `fetchRelatedWorkLogEntries(entry.id)` on open → GET `/api/work-log/:id/related`. Client-side filtering by all visible fields.

#### RoadDetailModal (src/components/RoadDetailModal.tsx)

Simple dialog showing road info:
- Road type badge (color-coded)
- Slug text
- Name as title
- Description (or "No description available.")

#### AlertDialog (inline in HomePage.tsx)

Delete confirmation:
```
Delete Work Log Entry
Are you sure you want to delete this entry? This action cannot be undone.
[Cancel] [Delete]
```

### # ------------------------------------------------------------------
### # 4.5 Pages
### # ------------------------------------------------------------------

#### HomePage (src/pages/HomePage.tsx) — 595 lines

The main Journal page. Three visual states:

**Loading state**: 10-row skeleton (`<Skeleton className="h-10 w-full" />`)

**Empty state**: "No Work Log Entries" heading + description

**Error state**: "Failed to Load Entries" + Retry button

**Data state**: Filter panel + Table + Modals

**Data fetching**:
- On mount: fetches work types (for filter dropdown options)
- On mount: fetches entries based on existing filters or road selection
- `fetchEntries()` accepts all filter params, passes them to `fetchWorkLogEntries()`
- Uses `limit: 1000` (loads all matching entries, client-side pagination via TanStack Table)

**Filter panel** (togglable via "Filter"/"Edit" button):
- Sort: RadioField (date_desc / date_asc)
- Filter by work type: ComboboxField (multi-select)
- Dates: two date inputs (from/to)
- Volume: two number inputs (from/to)
- Search: text input with search icon (searches across executorName, workType, road)
- Apply button → triggers API re-fetch with params
- Clear button → resets all filters, closes panel, refetches
- Active filters shown as Badges below Masthead

**DataTable** (from mg-table-tanstack):

| Column | Accessor | Notes |
|--------|----------|-------|
| Date | `row.original.date` | Formatted via `toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })` |
| Work Type | `workTypeName` | From denormalized field |
| Volume | `row.volume + ' ' + row.workTypeUnit` | Combined string |
| Executor | `executorName` | Full name |
| Road | `roadName` | From denormalized field |
| Status | — | Done (green check), In Progress (blue dot), Stopped (red stop) icons |
| Actions | — | Edit (pencil) + Delete (trash) buttons |

- `pageSize: 10` with pagination controls
- Client-side sorting enabled
- Row click → opens WorkLogDetailModal
- Actions column has `stopPropagation()` to prevent row click

**CRUD operations**:
- Create: "New Entry" button → opens WorkLogEntryFormDialog in create mode
- Edit: pencil icon → opens WorkLogEntryFormDialog pre-populated
- Delete: trash icon → AlertDialog confirmation → `deleteWorkLogEntry(id)` → toast
- After any CRUD: re-fetches entries preserving current filters

**Filter persistence**: `useFiltersStore` (Zustand) — keeps filter state across navigations. `isApplied` flag controls whether filters are active. Selected roads from `useRoadsStore` are always applied as implicit filter.

#### SettingsPage (src/pages/SettingsPage.tsx) — 545 lines

Two tabs: Roads (default) + Account.

**RoadsTab**:
- Fetches roads on mount from API
- Search input with client-side filtering (by name + slug)
- Stats: "{selectedCount} of {totalCount} selected (filtered to {displayCount})"
- Select All / Deselect All buttons
- Filter/Group toggle button with badge display
- Road cards in 2-column grid
- Groups by road type if "Group by road type" is applied

**RoadCard**:
```tsx
<Card className={isSelected ? '' : 'opacity-50'}>
  <CardTitle>{road.name}</CardTitle>
  <Badge variant={typeVariant}>{road.roadType}</Badge>
  <CardDescription>{road.slug}</CardDescription>
  <Switch checked={isSelected} size="sm" className="pointer-events-none" />
</Card>
<Button Info> → RoadDetailModal
```
- Click card → toggles selection (updates roads.store → localStorage)
- Unselected cards: opacity-50
- Info button → opens RoadDetailModal

**RoadFilterControls**:
- Group by: ComboboxField (roadType)
- Filter by road type: ComboboxField (multi-select: highway/urban/bridge/tunnel/other)
- Sort: RadioField (name_asc / name_desc)
- Active filters shown as badges

**AccountTab**: Placeholder UI — disabled inputs for display name + email, disabled logout button. Labeled "Coming in epic-2."

### # ------------------------------------------------------------------
### # 4.6 Stores
### # ------------------------------------------------------------------

#### filters.store.ts (Zustand)

```typescript
interface FiltersState {
    sort: 'date_desc' | 'date_asc';
    filterWorkTypeIds: number[];
    filterDateFrom: string;
    filterDateTo: string;
    search: string;
    volumeFrom: string;
    volumeTo: string;
    isApplied: boolean;   // Whether filters are active
}
```

- `setFilters()` — replaces entire filter state
- `clearFilters()` — resets to defaults, sets `isApplied: false`

#### roads.store.ts (Zustand + localStorage)

```typescript
interface RoadsStore {
    selectedRoadIds: string[];
    setSelectedRoadIds: (ids: string[]) => void;
    toggleRoad: (id: string) => void;
}
```

- Persisted to localStorage under key `mg-construction-journal-roads`
- `toggleRoad`: adds if absent, removes if present
- `setSelectedRoadIds`: replaces entire selection
- Used by: HomePage (implicit filter), SettingsPage (RoadsTab management)

### # ------------------------------------------------------------------
### # 4.7 API Layer — api.service.ts
### # ------------------------------------------------------------------

Uses `ApiClient` (mg-api-axios-1) with base path `/api`:

```typescript
const API = apiClient.createApi({
    workLog: 'work-log',
    workTypes: 'work-types',
    roads: 'roads',
});
```

**Functions**:

| Function | HTTP | Endpoint | Returns |
|----------|------|----------|---------|
| fetchWorkLogEntries(params?) | GET | /api/work-log?filters | PaginatedResponse<WorkLogEntry> |
| fetchWorkLogEntryById(id) | GET | /api/work-log/:id | WorkLogEntry |
| createWorkLogEntry(dto) | POST | /api/work-log | WorkLogEntry |
| updateWorkLogEntry(id, dto) | PUT | /api/work-log/:id | WorkLogEntry |
| deleteWorkLogEntry(id) | DELETE | /api/work-log/:id | void |
| fetchRelatedWorkLogEntries(id) | GET | /api/work-log/:id/related | WorkLogEntry[] |
| fetchWorkTypes() | GET | /api/work-types | { data: WorkTypeItem[] } |
| fetchRoads() | GET | /api/roads | { data: Road[] } |
| fetchRoadById(id) | GET | /api/roads/:id | Road |

`fetchWorkLogEntries` translates frontend params to query filters:
- `workTypeIds: string[]` → comma-separated string
- `roadIds: string[]` → comma-separated string
- All params passed as `filters` object in `PathOptions`

Legacy compat functions (SettingsPage will be rewritten):
- `fetchSources()` — maps roads to Source interface
- `fetchRelatedArticles(id)` — alias to fetchRelatedWorkLogEntries

### # ------------------------------------------------------------------
### # 4.8 Types
### # ------------------------------------------------------------------

#### work-log.ts
```typescript
interface WorkLogEntry {
    id: number;
    date: string;            // ISO date
    workTypeId: number;
    workTypeName: string;
    workTypeUnit: string;
    roadId: number;
    roadName: string;
    volume: number;
    executorName: string;
    description?: string;
    topicId?: number;
    workDone: boolean;
    workInProgress: boolean;
    workStopped: boolean;
    createdAt: string;
    updatedAt: string;
}

interface PaginatedResponse<T> { data: T[]; total: number; page: number; totalPages: number; }

interface WorkLogFilters {
    dateFrom?: string;
    dateTo?: string;
    roadId?: number;
    workTypeId?: number;
    sort?: 'date_desc' | 'date_asc';
    workTypeIds?: string[];
    search?: string;
    volumeFrom?: number;
    volumeTo?: number;
    roadIds?: number[];
    page?: number;
    limit?: number;
}
```

#### roads.ts
```typescript
type RoadType = 'highway' | 'urban' | 'bridge' | 'tunnel' | 'other';
interface Road { id: number; name: string; slug: string; roadType: RoadType; description?: string; }
```

### # ------------------------------------------------------------------
### # 4.9 Frontend Dockerfile
### # ------------------------------------------------------------------

See [§3.8 Docker](#38-docker) for the full Docker architecture including
frontend build steps, multi-stage strategy, performance, and troubleshooting.

### # ------------------------------------------------------------------
### # 4.10 CSS — index.css
### # ------------------------------------------------------------------

```css
@import "tailwindcss";                     // Tailwind v4
@import "tw-animate-css";                  // Animation utilities
@import "shadcn/tailwind.css";             // shadcn/ui v4 Tailwind plugin
@import "../../../packages/mg-ui-shadcn-4/src/global.css";  // Custom global styles
@source "../../../packages/mg-ui-shadcn-4/src/**/*.{ts,tsx}"; // Tailwind source scanning
```

---

## # ==========================================================================
## # 5. Library Packages
## # ==========================================================================

### # ------------------------------------------------------------------
### # 5.1 mg-api-axios-1 (@mg-nx-forge/mg-api-axios-1)
### # ------------------------------------------------------------------

**Location**: packages/mg-api-axios-1/

**ApiClient class**:

```typescript
constructor(basePath = 'http://localhost:3001')
```

Creates an Axios instance with the base URL. Sets up interceptors:
- **Request interceptor**: currently a passthrough (token via HTTP-only cookies planned but not implemented)
- **Response interceptor**: 401 handler sets `_retry = true` flag (no actual retry logic), calls `HttpErrorInterceptor(error)` which dispatches to stub functions (Error401, Error503, UnhandledError — all empty)

**createApi(definition: Record<string, string>)**:
Takes an object like `{ workLog: 'work-log' }` and returns an object with same keys, each value having HTTP methods:

```typescript
interface ApiEndpointMethods<T = unknown> {
    get:    (options?: PathOptions) => Promise<T>;
    post:   (data: unknown, options?: PathOptions) => Promise<T>;
    put:    (data: unknown, options?: PathOptions) => Promise<T>;
    patch:  (data: unknown, options?: PathOptions) => Promise<T>;
    del:    (options?: PathOptions) => Promise<T>;
}
```

**PathOptions**:
```typescript
interface PathOptions {
    id?: string | number | null;
    filters?: Record<string, string | number | boolean | null | undefined> | null;
}
```

Path resolution:
- `$id` placeholder in URL string → replaced with id value
- No `$id` in URL and id provided → appended as `/id`
- `filters` object → serialized as query string `?key=value&key2=value2`

### # ------------------------------------------------------------------
### # 5.2 mg-router-zustand-1 (@mg-nx-forge/mg-router-zustand-1)
### # ------------------------------------------------------------------

**Location**: packages/mg-router-zustand-1/

**Exports**:
- `useRouterStorage` — Zustand store with `currentPage`, `setCurrentPage()`, `getCurrentPageTitle()`
- `initializeCurrentPage(pages)` — on app mount, matches current URL to page entity
- `useRedirect()` — hook with `redirect(page, opt?)` that calls `navigate()` + `setCurrentPage()` + `console.log('page', page)`

**PageEntity**:
```typescript
interface PageEntity { title: string; desk?: string; url: string; }
```

### # ------------------------------------------------------------------
### # 5.3 mg-infinite-view-tanstack (@mg-nx-forge/mg-infinite-view-tanstack)
### # ------------------------------------------------------------------

**Location**: packages/mg-infinite-view-tanstack/

**QueryProvider**: Wraps children in `QueryClientProvider` with pre-configured `QueryClient` (staleTime: 30s, retry: 2, no refetch on focus).

**useInfiniteView<T>(options)**: Infinite scroll hook combining TanStack Query's `useInfiniteQuery` with `react-intersection-observer`.

```typescript
interface UseInfiniteViewOptions<T> {
    queryKey: string;
    fetchFn: (page: number) => Promise<PaginatedResult<T>>;
    rootMargin?: string;
    threshold?: number;
    enabled?: boolean;
    staleTime?: number;
}

interface UseInfiniteViewResult<T> {
    items: T[];
    isLoading: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    isError: boolean;
    error: Error | null;
    fetchNextPage: () => void;
    refetch: () => void;
    ref: (node: Element | null) => void;  // sentinel element ref
}
```

Auto-fetches next page when sentinel element enters viewport.

### # ------------------------------------------------------------------
### # 5.4 mg-table-tanstack (@mg-nx-forge/mg-table-tanstack)
### # ------------------------------------------------------------------

**Location**: packages/mg-table-tanstack/

**useDataTable<TData>(options)**:
```typescript
interface UseDataTableOptions<TData> {
    columns: ColumnDef<TData>[];
    data: TData[];
    pageSize?: number;          // default 10
    enableSorting?: boolean;    // default true
    enableFilters?: boolean;    // default true
    enablePagination?: boolean; // default true
    enableVirtualization?: boolean;
    enableRowSelection?: boolean;
}
```

Returns `{ table, globalFilter, setGlobalFilter }`. Configures:
- Sorting, column filtering, global filtering, pagination, row selection state
- `getFacetedRowModel` + `getFacetedUniqueValues` for filter facets
- `autoResetPageIndex: false`

**DataTable** component:
```typescript
interface DataTableProps<TData> {
    table: Table<TData>;
    columns: ColumnDef<TData>[];
    toolbar?: boolean;                    // Show TableToolbar
    pagination?: boolean;                 // Show TablePagination
    className?: string;
    globalFilter?: string;
    onGlobalFilterChange?: (value: string) => void;
    virtualization?: boolean;             // Enable virtual scrolling
    virtualizedRows?: number;
    tableContainerRef?: RefObject;
    onRowClick?: (row: TData) => void;
}
```

Features:
- Virtualized scrolling (via @tanstack/react-virtual) with sticky header
- Non-virtualized mode with standard table rows
- Row click handler with cursor-pointer styling
- Client-side "No results." empty state
- Pagination controls below table

**TableToolbar**: Search input + column visibility toggle

**TablePagination**: Page info + prev/next buttons

### # ------------------------------------------------------------------
### # 5.5 mg-ui-shadcn-4 (@mg-nx-forge/mg-ui-shadcn-4)
### # ------------------------------------------------------------------

**Location**: packages/mg-ui-shadcn-4/

55+ UI components re-exported from shadcn/ui + custom components:

**shadcn/ui components**: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, button-group, calendar, card, carousel, chart, checkbox, collapsible, combobox, command, context-menu, dialog, drawer, dropdown-menu, empty, field, hover-card, input, input-group, input-otp, item, kbd, label, menubar, native-select, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs, textarea, toggle, toggle-group, tooltip, typography

**Form components** (custom wrappers): Form, InputField, TextareaField, SelectField, ComboboxField, CheckboxField, RadioField

**Layout components**: PageLayout (PLFullBlock, PLRow, PLColumn)

**Effects**: ClickSpark (cursor particle effect), SplashCursor (trail effect)

**Theme**: ThemeProvider (light/dark/system), ModeToggle button

**Hooks**: `useIsMobile()`

**Utils**: `cn()` — class-variance-authority + tailwind-merge

---

## # ==========================================================================
## # 6. Configuration Files
## # ==========================================================================

### package.json (root)
- npm workspaces: `apps/*`, `packages/*`
- Scripts: format, lint, check, build:all, lint:all, typecheck:all, test:all
- `overrides.axios: 1.16.0` — force axios version across workspace
- `engines.node: >=22.12 <23`

### tsconfig.base.json
- Target ES2020, module ESNext, node resolution
- Path aliases for all 5 packages (IDE resolution)
- emitDecoratorMetadata + experimentalDecorators for NestJS

### nx.json
- `npmScope: mg-construction-journal`
- `defaultBase: master`
- Cache enabled for build, lint, test
- Production files exclude test specs

### biome.json
- 4-space indent, 120 line width
- Single quotes, semicolons, trailing commas ES5
- Tailwind CSS v4 directive support enabled
- Many recommended linter rules disabled (see AGENTS.md for full list)

### mise.toml
- Node 22
- Env vars for ports, NODE_ENV, LOG_ENV
- Tasks: clean, dev-all, seed, seed-mock, seed-clear, db-push, db-generate

### docker-compose.yml

Three services defined in `docker-compose.yml` at repo root:

```yaml
services:
    postgres:
        image: postgres:16-alpine
        environment:
            POSTGRES_DB: mg-construction-journal
            POSTGRES_USER: user
            POSTGRES_PASSWORD: password
        volumes:
            - postgres_data:/var/lib/postgresql/data
        healthcheck:
            test: ['CMD-SHELL', 'pg_isready -U user -d mg-construction-journal']

    backend:
        build:
            context: .
            dockerfile: apps/mg-construction-journal-backend/Dockerfile
        environment:
            DB_PROVIDER: postgresql
            DATABASE_URL: postgresql://user:password@postgres:5432/mg-construction-journal?schema=public
            MG_CONSTRUCTION_JOURNAL_BACKEND_PORT: '8001'
        ports: ['8001:8001']
        depends_on:
            postgres: { condition: service_healthy }

    frontend:
        build:
            context: .
            dockerfile: apps/mg-construction-journal/Dockerfile
        ports: ['3002:80']
        depends_on: [backend]

volumes:
    postgres_data:
```

See [§3.8 Docker](#38-docker) for detailed architecture and build modes.

---

## # ==========================================================================
## # 7. Code Style Conventions
## # ==========================================================================

### Comment Style

The project uses section comment markers for organization:

```typescript
// # ------------------------------------------------------------------
// # Section Name
// # ------------------------------------------------------------------

// # Sub-section

// name  — inline note
// # ==========================================================================
// # # Major section
// # ==========================================================================
// # ---------------------------------------------------------------------------
// # line separator
```

### Export Convention

All components use `export default function Component()` — inline default export,
never separate declaration + default export.

### Component Naming

- Pages: PascalCase (HomePage, SettingsPage)
- Components: PascalCase (Header, Masthead, RoadCard)
- Stores: camelCase with `use` prefix (useRoadsStore, useFiltersStore)
- Services: camelCase (api.service, pages.service)
- Types/Interfaces: PascalCase (WorkLogEntry, PaginatedResponse)
- DTOs: PascalCase ending with Dto (CreateWorkLogEntryDto)
- Entities: PascalCase ending with Item (WorkLogEntryItem)

---

## # ==========================================================================
## # 8. Data Flows (End-to-End Examples)
## # ==========================================================================

### 8.1 Creating a work log entry

1. User clicks "New Entry" button on HomePage
2. `setEditingEntry(null); setIsFormOpen(true)` → opens WorkLogEntryFormDialog
3. Dialog fetches work types + roads from API
4. User fills form, clicks "Create Entry"
5. Zod validates all fields
6. `handleSubmit` calls `createWorkLogEntry(dto)` → POST /api/work-log
7. NestJS `ValidationPipe` validates DTO
8. `WorkLogService.create()` inserts into SQLite/PostgreSQL via Prisma
9. Response returns `WorkLogEntryItem` with denormalized names
10. Dialog closes, success toast shown, `onSuccess()` triggers re-fetch

### 8.2 Filtering entries

1. User clicks "Filter" button → filter panel opens
2. User selects date range, work type(s), volume range, search text
3. Clicks "Apply"
4. `handleApply()` updates `useFiltersStore` with all values + `isApplied: true`
5. `fetchEntries()` builds param object, passes to `fetchWorkLogEntries()`
6. API sends GET /api/work-log?dateFrom=...&dateTo=...&workTypeIds=1,2&search=...
7. Backend parses `WorkLogQueryDto`, builds Prisma `where` clause
8. Prisma runs filtered query, returns matching rows
9. Table re-renders with results, filter badges appear below Masthead

### 8.3 Cross-road task grouping

1. Creating an entry with `topicId: 1`
2. Creating another entry on a different road with `topicId: 1`
3. Clicking either entry's row opens WorkLogDetailModal
4. Modal detects `topicId` is set
5. Calls `GET /api/work-log/:id/related`
6. Backend finds all entries with same topicId (excluding self)
7. Modal shows "Related entries — Task #1" with scrollable list
8. User can click a related entry to navigate to it

### 8.4 Road selection affecting entries

1. User navigates to Settings → Roads
2. Toggles roads on/off via RoadCard clicks
3. `useRoadsStore` updates, persists to localStorage
4. User navigates back to Journal
5. `selectedRoadIds` passed as `roadIds` filter to API
6. Backend filters entries to selected roads
7. Subsequent filter applies or re-fetches always include road selection

---

## # ==========================================================================
## # 9. Testing — Plan
## # ==========================================================================

**Note**: Tests are not yet implemented. The following is the planned test
infrastructure and coverage. See `.opencode/plans/test-plan.md` for 200+ cases.

### Infrastructure
- Vitest + @testing-library/react + jsdom for unit/component tests
- Playwright for E2E tests (chromium, firefox, webkit)
- Test targets in each project.json
- Page objects for E2E: HomePage.po.ts, SettingsPage.po.ts

### Unit Tests (library packages)
- mg-api-axios-1: ApiClient, URL resolution, interceptors
- mg-router-zustand-1: store, initializeCurrentPage, useRedirect
- mg-infinite-view-tanstack: useInfiniteView, QueryProvider
- mg-table-tanstack: useDataTable, DataTable, Pagination, Toolbar
- mg-ui-shadcn-4: all form components, UI components, ThemeProvider, ModeToggle

### Component Tests (app)
- Header, Masthead, HomePageSkeleton
- HomePage: loading/empty/error/data states, filter panel
- SettingsPage: RoadsTab, loading/error states
- WorkLogDetailModal: null/no topicId/loading/empty/search states
- WorkLogEntryFormDialog: create/edit/validation/loading
- RoadDetailModal, RoadCard, App routing

### Backend Integration Tests
- All 6 work-log endpoints (create, findAll with filters, findOne, update, delete, related)
- Road + WorkType controllers
- Auth controller (register, login, me)
- Validation rules (required fields, type coercion, whitelist)
- Error cases (400, 404, 409, 401)

### E2E Tests
- Navigation (Journal, Roads routes)
- Full CRUD flow (create, read, edit, delete)
- DataTable (pagination, sorting, row click)
- Filter panel (all filters, apply, clear, badges, search)
- Detail modal (entry details, related entries, search, close)
- SettingsPage (road cards, toggle, search, select/deselect, group, filter)
- Theme switching (light, dark, system)
- Cross-feature (road selection affects HomePage, topicId groups)
- Responsive (mobile, tablet, desktop)

### Audit Items (need Playwright)
- A1: HttpErrorInterceptor stubs are empty — verify recovery from 401/503
- A2: Auth DTOs have no class-validator decorators — verify bypass behavior
- A3: console.log on every navigation
- A4: 401 retry flag set but never retries
- A5: No responsive navigation — may overflow on mobile
- A6: No React Error Boundary — verify crash handling
- A7: 16 of 17 API endpoints are public (no auth)
- A8: SplashCursor and ClickSpark use ts-nocheck

---

## # ==========================================================================
## # 10. Appendix
## # ==========================================================================

### Environment Variables

| Variable | Default | Used By |
|----------|---------|---------|
| MG_CONSTRUCTION_JOURNAL_PORT | 3002 | Frontend Vite dev server |
| MG_CONSTRUCTION_JOURNAL_BACKEND_PORT | 8001 | Backend NestJS server |
| DATABASE_URL | file:./prisma/dev.db | Prisma datasource |
| DB_PROVIDER | sqlite | Prisma adapter selection |
| JWT_SECRET | mg-construction-journal-dev-secret | JWT signing |
| NODE_ENV | development | General environment |
| TSX_TSCONFIG_PATH | — | Path to tsconfig for tsx (Docker: tsconfig.docker.json) |

### Nx Project Commands

| Command | Description |
|---------|-------------|
| `nx run mg-construction-journal:dev` | Start frontend dev server |
| `nx run mg-construction-journal:build` | Build frontend for production |
| `nx run mg-construction-journal-backend:dev` | Start backend dev server |
| `nx run mg-construction-journal-backend:build` | Build backend |
| `nx run mg-construction-journal-backend:seed` | Seed base data |
| `nx run mg-construction-journal-backend:seed-mock` | Generate 1000 mock entries |
| `nx run mg-construction-journal-backend:seed-clear` | Delete all entries |

### Mise Tasks

| Task | Description |
|------|-------------|
| `mise run dev-all` | Start all app dev servers |
| `mise run seed` | Seed base data |
| `mise run seed-mock` | Generate mock data |
| `mise run seed-clear` | Clear entries |
| `mise run db-push` | Push Prisma schema to DB |
| `mise run db-generate` | Generate Prisma client |
| `mise run clean` | Remove node_modules and dist |

### Root npm Scripts

| Script | Action |
|--------|--------|
| `npm run format` | Biome format all files |
| `npm run lint` | Biome lint + auto-fix |
| `npm run check` | Biome check + typecheck all |
| `npm run build:all` | Build all projects |
| `npm run test:all` | Test all projects (pending test setup) |
