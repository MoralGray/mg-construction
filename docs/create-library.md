# Creating a New Library Package

This guide explains how to add a new library package to the monorepo.

## Overview

Libraries live under `packages/` and are shared between apps. Each library needs its own config files and must be wired into consuming apps via path aliases.

## Step-by-Step

### 1. Create the directory structure

```bash
mkdir -p packages/<library-name>/src
```

### 2. Create `package.json`

```json
{
    "name": "@mg-nx-forge/<library-name>",
    "version": "0.0.1",
    "type": "module",
    "main": "./src/index.ts",
    "types": "./src/index.ts",
    "scripts": {
        "build": "tsc -b",
        "typecheck": "tsc --noEmit",
        "format": "npx biome format --write .",
        "lint": "npx biome lint --write .",
        "check": "npx biome check --write . && npm run typecheck"
    },
    "dependencies": {}
}
```

**Key fields:**
- `name` — use the `@mg-nx-forge/` scope for consistency
- `main` / `types` — point to `./src/index.ts` (source entry, not built output)
- `type: "module"` — enables ESM
- Add dependencies from the consuming app if needed, or keep the library dependency-free

### 3. Create `tsconfig.json`

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "useDefineForClassFields": true,
        "lib": ["ES2020"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true,
        "declaration": true,
        "declarationMap": true,
        "baseUrl": ".",
        "paths": {
            "@/*": ["./src/*"]
        }
    },
    "include": ["src"]
}
```

**Notes:**
- Use `"lib": ["ES2020"]` for non-DOM libraries (no React). Add `"DOM"` if the library uses browser APIs.
- Set `"jsx": "react-jsx"` if the library contains React components.
- `declaration: true` enables `.d.ts` generation for type consumers.
- `noEmit: true` combined with `declaration: true` — TypeScript checks types without emitting files (source-only resolution).

### 4. Create `project.json`

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "name": "<library-name>",
    "project": {
        "type": "library"
    },
    "sourceRoot": "packages/<library-name>/src",
    "targets": {
        "build": {
            "executor": "nx:run-commands",
            "options": {
                "command": "npm run build",
                "cwd": "packages/<library-name>"
            }
        },
        "lint": {
            "executor": "nx:run-commands",
            "options": {
                "command": "npm run lint",
                "cwd": "packages/<library-name>"
            }
        },
        "typecheck": {
            "executor": "nx:run-commands",
            "options": {
                "command": "npm run typecheck",
                "cwd": "packages/<library-name>"
            }
        }
    }
}
```

### 5. Create the source entry point

`src/index.ts` — export the public API:

```ts
export { myFunction } from './my-module';
```

### 6. Wire into consuming apps

For each app that uses this library, two configs need updating:

#### a) `vite.config.ts` — add an alias

```ts
{
    find: '@mg-nx-forge/<library-name>',
    replacement: path.resolve(__dirname, '../../packages/<library-name>/src/index.ts'),
},
```

#### b) `tsconfig.app.json` — add a path entry

```json
"paths": {
    "@/*": ["./src/*"],
    "@mg-nx-forge/<library-name>": ["../../packages/<library-name>/src/index.ts"]
}
```

This allows the app to import from the library directly:

```ts
import { myFunction } from '@mg-nx-forge/<library-name>';
```

## Verification

Check Nx recognizes the library:

```bash
npx nx show project <library-name>
```

Build:

```bash
npx nx run <library-name>:build
```

Lint:

```bash
npx nx run <library-name>:lint
```

## Reference: Existing Libraries

| Package | npm Name | Contains |
|---------|----------|----------|
| `mg-ui-shadcn-4` | `@mg-nx-forge/mg-ui-shadcn-4` | 55+ shadcn/ui components, forms, icon loaders |
| `mg-router-zustand-1` | `@mg-nx-forge/mg-router-zustand-1` | React Router + Zustand page store |
| `mg-api-axios-1` | `@mg-nx-forge/mg-api-axios-1` | Axios API client with interceptors |
| `mg-static` | `@mg-nx-forge/mg-static` | Static data (languages, countries in Russian) |
