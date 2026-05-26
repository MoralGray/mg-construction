---
name: create-library
description: Prompt for creating a new library package in the monorepo
---

# Skill: Create a New Library Package

**Trigger:** When asked to "create a new library", "add a new package", "make a shared module", or similar.

**Instructions:**

1. Ask the user for:
   - Library directory name (under `packages/`)
   - npm package name (use `@mg-nx-forge/` scope)
   - Whether it contains React components (needs `jsx: "react-jsx"` in tsconfig)

2. Create the directory: `mkdir -p packages/<name>/src`

3. Generate the following files following the patterns in `docs/create-library.md`:
   - `packages/<name>/package.json` — with `@mg-nx-forge/<name>` scope
   - `packages/<name>/tsconfig.json` — ES2020, bundler, strict, declarations
   - `packages/<name>/project.json` — Nx targets (build, lint)
   - `packages/<name>/src/index.ts` — public API entry

4. For each consuming app, update:
   - `apps/<app-name>/vite.config.ts` — add alias for the library
   - `apps/<app-name>/tsconfig.app.json` — add path entry

5. Verify: `npx nx run <name>:lint`

**Reference:** Full details at `docs/create-library.md`
