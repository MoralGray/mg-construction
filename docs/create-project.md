# Creating a New Project (App)

This guide explains how to add a new application to the monorepo.

## Overview

A project in this monorepo is an application (frontend or backend) that lives under `apps/`. Each project requires its own set of configuration files to integrate with Nx, TypeScript, Vite, and Biome.

## Step-by-Step

### 1. Create the directory structure

```bash
mkdir -p apps/<project-name>/src
```

### 2. Create `package.json`

```json
{
    "name": "<project-name>",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "tsc -b && vite build",
        "typecheck": "tsc -b",
        "format": "npx biome format --write .",
        "lint": "npx biome lint --write .",
        "check": "npx biome check --write . && npm run typecheck",
        "preview": "vite preview"
    },
    "dependencies": {
        "react": "^19.2.0",
        "react-dom": "^19.2.0"
    },
    "devDependencies": {
        "@types/react": "^19.2.5",
        "@types/react-dom": "^19.2.3",
        "@vitejs/plugin-react": "^5.2.0",
        "typescript": "~5.9.3",
        "vite": "^8.0.10"
    }
}
```

The `name` field must be unique across the monorepo. It's used by Nx to reference the project.

The `workspaces` field in root `package.json` (`["apps/*", "packages/*"]`) automatically picks up the new project — no manual registration needed.

### 3. Create `project.json`

This is the Nx project configuration. It defines available targets (commands) for the project.

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "name": "<project-name>",
    "project": {
        "type": "application"
    },
    "sourceRoot": "apps/<project-name>/src",
    "targets": {
        "build": {
            "executor": "nx:run-commands",
            "options": {
                "command": "npm run build",
                "cwd": "apps/<project-name>"
            }
        },
        "dev": {
            "executor": "nx:run-commands",
            "options": {
                "command": "vite",
                "cwd": "apps/<project-name>"
            },
            "forwardAllArgs": true,
            "continuous": true
        },
        "lint": {
            "executor": "nx:run-commands",
            "options": {
                "command": "npm run lint",
                "cwd": "apps/<project-name>"
            }
        },
        "test": {
            "executor": "@nx/vite:test",
            "options": {
                "buildTarget": "<project-name>:build"
            }
        },
        "typecheck": {
            "executor": "nx:run-commands",
            "options": {
                "command": "npm run typecheck",
                "cwd": "apps/<project-name>"
            }
        }
    }
}
```

**Key fields:**
- `name` — unique project identifier (matches `package.json` name or is independent)
- `project.type` — `"application"` for apps, `"library"` for packages
- `sourceRoot` — points to the source directory for caching
- `targets` — tasks Nx can run (build, dev, lint, test)
- `executor` — how to run the target (`nx:run-commands` runs a shell command; `@nx/vite:test` uses the Vite executor)
- `cwd` — working directory for the command
- `continuous` — set to `true` for dev servers (keeps watching)
- `forwardAllArgs` — passes CLI arguments through to the command

### 4. Create `tsconfig.json`

```json
{
    "files": [],
    "references": [
        { "path": "./tsconfig.app.json" },
        { "path": "./tsconfig.node.json" }
    ]
}
```

This is a solution-style tsconfig that references the app and node configs.

### 5. Create `tsconfig.app.json`

```json
{
    "compilerOptions": {
        "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
        "target": "ES2022",
        "useDefineForClassFields": true,
        "lib": ["ES2022", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "types": ["vite/client"],
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "verbatimModuleSyntax": true,
        "moduleDetection": "force",
        "noEmit": true,
        "jsx": "react-jsx",
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "erasableSyntaxOnly": true,
        "noFallthroughCasesInSwitch": true,
        "noUncheckedSideEffectImports": true,
        "paths": {
            "@/*": ["./src/*"]
        }
    },
    "include": ["src"]
}
```

### 6. Create `tsconfig.node.json`

```json
{
    "compilerOptions": {
        "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
        "target": "ES2022",
        "lib": ["ES2023"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "verbatimModuleSyntax": true,
        "moduleDetection": "force",
        "noEmit": true,
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "erasableSyntaxOnly": true,
        "noFallthroughCasesInSwitch": true,
        "noUncheckedSideEffectImports": true
    },
    "include": ["vite.config.ts"]
}
```

### 7. Create `vite.config.ts`

```ts
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: [
            {
                find: '@',
                replacement: path.resolve(__dirname, './src'),
            },
        ],
        dedupe: ['react', 'react-dom'],
    },
});
```

### 8. Create entry files

- `src/main.tsx` — React entry point
- `src/App.tsx` — Root component
- `index.html` — HTML template with `<div id="root">` and `script` tag pointing to `src/main.tsx`

### 9. Register path aliases in root `tsconfig.base.json` (if needed)

If the new app needs to consume monorepo packages, add path aliases:

```json
{
    "compilerOptions": {
        "paths": {
            "@mg-nx-forge/mg-ui-shadcn-4": ["packages/mg-ui-shadcn-4/src/index.ts"],
            "@mg-nx-forge/<package-name>": ["packages/<package-name>/src/index.ts"]
        }
    }
}
```

## Verification

After creating the project, verify it's recognized by Nx:

```bash
npx nx show project <project-name>
```

Run the dev server:

```bash
npx nx run <project-name>:dev
```

Run lint:

```bash
npx nx run <project-name>:lint
```
