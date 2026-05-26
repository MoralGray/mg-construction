# Nx Monorepo Guide

Reference for the Nx configuration used in this project.

## Overview

This monorepo uses Nx v22.7.0 with npm workspaces (`npm` as the package manager). Nx provides task orchestration, caching, and dependency graph management on top of the npm workspaces.

## Configuration Files

### Root `nx.json`

```json
{
    "$schema": "./node_modules/nx/schemas/nx-schema.json",
    "npmScope": "mg-nx-forge",
    "defaultBase": "master",
    "neverConnectToCloud": true,
    "analytics": false,
    "targetDefaults": {
        "build": { "cache": true },
        "lint": { "cache": true },
        "test": { "cache": true }
    },
    "namedInputs": {
        "default": ["{projectRoot}/**/*", "sharedGlobals"],
        "sharedGlobals": [],
        "production": [
            "default",
            "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)"
        ]
    }
}
```

**Key fields:**

| Field | Description |
|-------|-------------|
| `npmScope` | NPM scope used for packages (`@mg-nx-forge/`) |
| `defaultBase` | Default base branch for affected commands (`master`) |
| `neverConnectToCloud` | Disables Nx Cloud (all local) |
| `targetDefaults` | Default caching behavior per target type |
| `namedInputs` | Named input sets for cache computation |
| `targetDefaults.*.cache` | Whether to cache task outputs |

### Project `project.json`

Each app/package has its own `project.json`. Two styles are used:

#### Style A: `nx:run-commands` (simpler)

```json
{
    "name": "<project-name>",
    "$schema": "http://json-schema.org/draft-07/schema#",
    "project": { "type": "application" },
    "sourceRoot": "apps/<project-name>/src",
    "targets": {
        "build": {
            "executor": "nx:run-commands",
            "options": {
                "command": "npm run build",
                "cwd": "apps/<project-name>"
            }
        }
    }
}
```

Used by: all projects (targets delegate to `npm run <script>` in package.json)

#### Style B: `@nx/js:tsc` executor (dedicated build)

```json
{
    "name": "mg-ui-shadcn-4",
    "$schema": "../../node_modules/nx/schemas/project-schema.json",
    "sourceRoot": "packages/mg-ui-shadcn-4/src",
    "projectType": "library",
    "targets": {
        "build": {
            "executor": "@nx/js:tsc",
            "outputs": ["{options.outputPath}"],
            "options": {
                "outputPath": "dist/packages/mg-ui-shadcn-4",
                "main": "packages/mg-ui-shadcn-4/src/index.ts",
                "tsConfig": "packages/mg-ui-shadcn-4/tsconfig.lib.json",
                "assets": []
            }
        }
    }
}
```

Used by: `mg-ui-shadcn-4`

**Target executor comparison:**

| Executor | Use Case |
|----------|----------|
| `nx:run-commands` | Run any shell command — flexible, no special config |
| `@nx/js:tsc` | Compile TypeScript with output to `dist/` — adds caching and outputs |

**`project.json` field reference:**

| Field | Description |
|-------|-------------|
| `name` | Unique project identifier used in `nx run <name>:<target>` |
| `project.type` / `projectType` | `"application"` or `"library"` |
| `sourceRoot` | Source directory for caching inputs |
| `targets.<name>.executor` | How to execute the target |
| `targets.<name>.options.command` | Shell command to run |
| `targets.<name>.options.cwd` | Working directory for the command |
| `targets.<name>.forwardAllArgs` | Pass CLI args through to the command |
| `targets.<name>.continuous` | Keep process running (for dev servers) |
| `targets.<name>.outputs` | Output paths for caching |

### Root `package.json`

```json
{
    "name": "mg-nx-forge",
    "private": true,
    "workspaces": ["apps/*", "packages/*"],
    "scripts": {
        "biome:all": "npx biome check --write . && npx nx run-many --target=typecheck --all"
    },
    "devDependencies": {
        "nx": "22.7.0",
        "@nx/js": "22.7.0",
        "@nx/react": "22.7.0",
        "@nx/vite": "22.7.0",
        "@nx/web": "22.7.0",
        "@nx/workspace": "22.7.0",
        "@biomejs/biome": "^1.9.4"
    }
}
```

The `workspaces` field (`["apps/*", "packages/*"]`) tells npm and Nx where to find projects. Any new directory under `apps/` or `packages/` with a `package.json` is automatically discovered.

### Root `tsconfig.base.json`

```json
{
    "compilerOptions": {
        "rootDir": ".",
        "target": "ES2020",
        "module": "ESNext",
        "moduleResolution": "node",
        "lib": ["ES2020", "DOM"],
        "skipLibCheck": true,
        "paths": {
            "@mg-nx-forge/mg-ui-shadcn-4": ["packages/mg-ui-shadcn-4/src/index.ts"]
        }
    }
}
```

## NPM Workspaces Integration

Nx works on top of npm workspaces. The `workspaces` field in root `package.json` defines project locations. Each workspace project has its own `package.json` and `node_modules` are hoisted to the root.

### Commands

```bash
# Install all dependencies
npm install

# Add dependency to a specific workspace
npm install <pkg> -w <workspace-name>

# Add dev dependency to a specific workspace
npm install <pkg> --save-dev -w <workspace-name>
```

## Nx Commands Reference

```bash
# Run a target on a single project
npx nx run <project>:<target>

# Run a target on all projects
npx nx run-many --target=<target> --all

# Run affected projects (since defaultBase)
npx nx affected --target=<target>

# Show project details
npx nx show project <project-name>

# Show dependency graph
npx nx graph

# Reset Nx cache
npx nx reset
```

## Common Targets

| Target | Description | Available on |
|--------|-------------|-------------|
| `dev` | Start dev server | Apps |
| `build` | Build for production | Apps, libs |
| `lint` | Run Biome linter (auto-fix) | Apps, libs |
| `format` | Format with Biome | Apps, libs |
| `check` | Biome check + typecheck (full validation) | Apps, libs |
| `test` | Run Vitest tests | Apps |
| `typecheck` | Run TypeScript type check | Apps, libs |

## Caching

Nx caches outputs of `build`, `lint`, and `test` targets (configured in `nx.json` `targetDefaults`). Cache is stored locally in `.nx/cache/`. To clear:

```bash
npx nx reset
```

## Path Resolution Strategy

This monorepo uses **source-level resolution** — apps import libraries directly from source (not from built `dist/`):

1. **Vite aliases** (`vite.config.ts`) — resolves imports at dev/build time
2. **TypeScript paths** (`tsconfig.app.json` or `tsconfig.base.json`) — resolves types for the editor and type-checking
3. **`file:` protocol** (optional in `package.json`) — helps IDEs resolve packages

This means:
- No build step needed for libraries during development
- Changes to library source are immediately reflected
- Libraries must have valid TypeScript (no build-time transformation)

## Adding a New Target

All `nx:run-commands` targets delegate to `npm run <script>` — the actual command lives in the project's `package.json`. To add a new target:

1. Add the script to `package.json`:
```json
"scripts": {
    "typecheck": "tsc --noEmit"
}
```

2. Add the target to `project.json`:
```json
"targets": {
    "typecheck": {
        "executor": "nx:run-commands",
        "options": {
            "command": "npm run typecheck",
            "cwd": "apps/<project-name>"
        }
    }
}
```

Then run: `npx nx run <project-name>:typecheck`
