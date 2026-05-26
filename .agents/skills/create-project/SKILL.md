---
name: create-project
description: Prompt for creating a new Nx application project in the monorepo
---

# Skill: Create a New Nx Project

**Trigger:** When asked to "create a new project", "add a new app", "scaffold an application", or similar.

**Instructions:**

1. Ask the user for the project name (directory name under `apps/`).

2. Create the directory: `mkdir -p apps/<name>/src`

3. Generate the following files following the patterns in `docs/create-project.md`:
   - `apps/<name>/package.json` — with correct name, react/vite deps
   - `apps/<name>/project.json` — with Nx targets (build, dev, lint, test)
   - `apps/<name>/tsconfig.json` — solution-style references
   - `apps/<name>/tsconfig.app.json` — app TypeScript config
   - `apps/<name>/tsconfig.node.json` — node TypeScript config (for vite.config.ts)
   - `apps/<name>/vite.config.ts` — Vite config with `@` alias
   - `apps/<name>/index.html` — HTML entry with `<div id="root">`
   - `apps/<name>/src/main.tsx` — React entry point
   - `apps/<name>/src/App.tsx` — Root component

4. If the user wants to consume monorepo libraries, follow `docs/integrating-ui-library.md` to add aliases and paths.

5. Verify: `npx nx show project <name>`

6. Inform the user that the project is ready and how to start it.

**Reference:** Full details at `docs/create-project.md`
