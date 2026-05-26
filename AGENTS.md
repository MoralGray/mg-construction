# AGENTS.md

## Project Overview

Nx v22.7.0 monorepo with npm workspaces containing 2 apps and 5 library packages. Uses React 19, TypeScript 5.9, Vite 8, Tailwind CSS v4, Biome for linting/formatting, and shadcn/ui components.

## Monorepo Layout

```
apps/
  mg-construction-journal/           — App: work log journal UI (shadcn, tanstack table)
  mg-construction-journal-backend/   — App: NestJS backend for work log CRUD + auth
packages/
  mg-api-axios-1          (npm: @mg-nx-forge/mg-api-axios-1)            — Axios API client with interceptors
  mg-infinite-view-tanstack (npm: @mg-nx-forge/mg-infinite-view-tanstack) — TanStack Query infinite scroll hooks
  mg-router-zustand-1     (npm: @mg-nx-forge/mg-router-zustand-1)      — React Router + Zustand page store
  mg-table-tanstack       (npm: @mg-nx-forge/mg-table-tanstack)        — TanStack Table wrapper
  mg-ui-shadcn-4          (npm: @mg-nx-forge/mg-ui-shadcn-4)           — 55+ shadcn/ui components + forms + icon loaders
```

Apps reference libraries via `path.resolve` aliases in vite.config.ts (source-level resolution).

## Ports

Ports are configured in `mise.toml` at the repo root.

| Env Variable | App | Port |
|---|---|---|
| `MG_CONSTRUCTION_JOURNAL_PORT` | mg-construction-journal | 3002 |
| `MG_CONSTRUCTION_JOURNAL_BACKEND_PORT` | mg-construction-journal-backend | 8001 |

## Setup Commands

- Install all deps: `npm install` (npm workspaces, runs from root)
- Add dep to specific workspace: `npm install <pkg> -w <workspace-name>` (e.g. `-w mg-construction-journal`)
- Add dep to root: `npm install <pkg> --save-dev` (runs from root)
- When adding a new package dependency, use an exact version — no `~` or `^` ranges.

## Development Workflow

- Start dev server: `npx nx run <project>:dev` (e.g. `npx nx run mg-construction-journal:dev`)
- Build project: `npx nx run <project>:build`
- Build all: `npx nx run-many --target=build --all`
- Run target on all: `npx nx run-many --target=<target> --all`
- Nx default base branch: `master`

### Per-Project Scripts (run from project directory or via nx)

| Script | Action |
|--------|--------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run typecheck` | TypeScript typecheck |
| `npm run format` | Format with Biome |
| `npm run lint` | Lint and auto-fix with Biome |
| `npm run check` | Biome check + typecheck (full validation) |
| `npm run preview` | Vite production preview |

### Workspace Tasks (run via mise)
- Do or run "clean" script under any condition
| Command | Action |
|---------|--------|
| `mise run clean` | Remove node_modules and dist from apps/packages |
| `mise run dev-all` | Start all app dev servers |

## Testing

No tests are currently configured. E2E tests use Playwright (see `.opencode/plans/test-plan.md`).

## Code Style (Biome)

Configuration in `biome.json` at root (applies to all projects).

### Formatter
- 4-space indent, 120 line width
- Single quotes, semicolons always, trailing commas es5
- Ignored: `dist/`, `**/tsconfig*.json`

### Export Convention
- Always use inline `export default function Component()` — never separate `export function Component()` + `export default Component`.

### Linter — Recommended ruleset with these rules disabled:
- **correctness**: `noUnusedVariables`, `useExhaustiveDependencies`
- **style**: `noUselessElse`, `useBlockStatements`, `noNonNullAssertion`, `noParameterAssign`, `useConst`
- **suspicious**: `noSelfCompare`, `noArrayIndexKey`, `noExplicitAny`, `noImplicitAnyLet`
- **a11y**: `useButtonType`, `useValidAnchor`, `noRedundantAlt`, `noSvgWithoutTitle`, `useKeyWithClickEvents`, `useFocusableInteractive`, `useSemanticElements`
- **complexity**: `noStaticOnlyClass`, `noForEach`
- **security**: `noDangerouslySetInnerHtml`

### Root Commands (run from repo root)

| Command | Action |
|---------|--------|
| `npm run format` | Format all files with Biome |
| `npm run lint` | Lint all files with Biome |
| `npm run check` | Biome check + typecheck all projects |
| `npm run build:all` | Build all projects |
| `npm run lint:all` | Lint all projects |
| `npm run typecheck:all` | Typecheck all projects |
| `npm run test:all` | Test all projects |

### Per-Project Commands
- `npx nx run <project>:lint` — Lint single project
- `npx biome check --write <path>` — Fix specific file/dir

## TypeScript

- **Root**: `tsconfig.base.json` — ES2020, ESNext modules, node resolution
- **Apps**: project references (`tsconfig.app.json` + `tsconfig.node.json`), ES2022, bundler resolution, strict, `verbatimModuleSyntax`, `noEmit`
- **mg-ui-shadcn-4**: extends base, ES2022, bundler resolution, composite + declarations
- **mg-router-zustand-1**, **mg-api-axios-1**, **mg-infinite-view-tanstack**, **mg-table-tanstack**: ES2020, bundler resolution, declarations, `noEmit`

### Path Aliases (per-app in vite.config.ts + tsconfig.app.json)
- Apps: `@/*` → `./src/*`
- Apps: `@mg-nx-forge/mg-ui-shadcn-4` → `packages/mg-ui-shadcn-4/src/index.ts`
- Apps: `@mg-nx-forge/mg-router-zustand-1` → `packages/mg-router-zustand-1/src/index.ts`
- Apps: `@mg-nx-forge/mg-api-axios-1` → `packages/mg-api-axios-1/src/index.ts`
- Apps: `@mg-nx-forge/mg-infinite-view-tanstack` → `packages/mg-infinite-view-tanstack/src/index.ts`
- Apps: `@mg-nx-forge/mg-table-tanstack` → `packages/mg-table-tanstack/src/index.ts`
- Apps: `@ui` / `@ui/*` → mg-ui-shadcn-4/src (vite.config.ts only)
- mg-ui-shadcn-4: `@ui/*` → `./*` (tsconfig)

## Build Outputs

- `dist/packages/mg-ui-shadcn-4/` — Library build (via `@nx/js:tsc` executor)
- `dist/apps/<app-name>/` — App build output (via Vite)
- Build artifacts are gitignored

## Documentation

Detailed guides are in [`docs/`](./docs/):
- [`docs/create-project.md`](./docs/create-project.md) — How to add a new app
- [`docs/create-library.md`](./docs/create-library.md) — How to add a new library
- [`docs/integrating-ui-library.md`](./docs/integrating-ui-library.md) — How to use mg-ui-shadcn-4
- [`docs/nx-guide.md`](./docs/nx-guide.md) — Nx configuration reference

## Skills

Available skills for agent workflows:

| Skill | Location | Purpose |
|-------|----------|---------|
| create-agentsmd | `.agents/skills/create-agentsmd/` | Generate AGENTS.md for a repo |
| create-library | `.agents/skills/create-library/` | Create a new library package |
| create-project | `.agents/skills/create-project/` | Create a new Nx app project |
| documentation-writer | `.agents/skills/documentation-writer/` | Diátaxis technical documentation |
| frontend-design | `.agents/skills/frontend-design/` | Production-grade frontend UI |
| link-workspace-packages | `.opencode/skills/link-workspace-packages/` | Wire workspace package deps |
| monitor-ci | `.opencode/skills/monitor-ci/` | Monitor Nx Cloud CI pipeline |
| nx-generate | `.opencode/skills/nx-generate/` | Scaffold code via Nx generators |
| nx-import | `.opencode/skills/nx-import/` | Import repos into Nx workspace |
| nx-plugins | `.opencode/skills/nx-plugins/` | Discover and add Nx plugins |
| nx-run-tasks | `.opencode/skills/nx-run-tasks/` | Run Nx tasks (build, test, etc.) |
| nx-workspace | `.opencode/skills/nx-workspace/` | Explore and debug Nx workspace |

## Comments
- Use comments this that style
- Or simple //
- (### N) is name of type of comment
### line
// # -------------------------------------------------------------------------------------------------------------------------------------------
### main section
// # ==========================================================================
// # name
// # ==========================================================================
### subsection
// # ------------------------------------------------------------------
// # name
// # ------------------------------------------------------------------
###
// name

## TODO.md

Location: `TODO.md` at repo root — project-wide task tracking and epic plans.
Do not work on tasks/epics if not asked or given to you. Just know they are there, follow the style guide if you are asked.

Style guide:
- Only first (#) and second (##) and third (###) heading levels allowed — no deeper headings
- No markdown syntax beyond headings and lists (no bold, code ticks, links, etc.)
- Only simple `-` list items — no `- [ ]` checkboxes or `- [x]` done markers
- Done items use `<prefix>[DONE] <text>` format: insert `[DONE]` immediately after the number/dash prefix, before the text (e.g. `1. [DONE] text`, `- [DONE] text`, `- - [DONE] text`)
- Do not change original item text or structure — only add `[DONE]` after its prefix
- Do not update title (#, ##, ###) with `[DONE]`

## Important moments
- Do not change linter settings
- Do not change how project commands run
- Do not build project, only run lint
- Run all commands with "timeout"
- If user mentioned TODO.md file and work was with that tasks/epics, do not forget to update current state.

## Styles
- Almost all project uses mg-ui-shadcn-4 ui library
- Prefer to use ui library components
- Do not do custom fonts

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax


<!-- nx configuration end-->
