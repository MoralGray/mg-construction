# Integrating mg-ui-shadcn-4 into an App

This guide explains how to use the shared UI component library (`@mg-nx-forge/mg-ui-shadcn-4`) in an application.

## Prerequisites

- An Nx project (app) inside the monorepo
- The app must use React + Vite

## Configuration

### 1. Vite aliases

In the app's `vite.config.ts`, add aliases for the library:

```ts
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        alias: [
            // Library entry point
            {
                find: '@mg-nx-forge/mg-ui-shadcn-4',
                replacement: path.resolve(__dirname, '../../packages/mg-ui-shadcn-4/src/index.ts'),
            },
            // Library source root (for deep imports)
            {
                find: '@mg-nx-forge/mg-ui-shadcn-4/src',
                replacement: path.resolve(__dirname, '../../packages/mg-ui-shadcn-4/src'),
            },
            // Shorthand alias for the library source
            {
                find: '@ui',
                replacement: path.resolve(__dirname, '../../packages/mg-ui-shadcn-4/src'),
            },
            {
                find: '@ui/*',
                replacement: path.resolve(__dirname, '../../packages/mg-ui-shadcn-4/src/*'),
            },
        ],
        dedupe: ['react', 'react-dom'],
    },
});
```

### 2. TypeScript path aliases

In `tsconfig.app.json`:

```json
"paths": {
    "@/*": ["./src/*"],
    "@mg-nx-forge/mg-ui-shadcn-4": ["../../packages/mg-ui-shadcn-4/src/index.ts"]
}
```

### 3. Tailwind CSS v4 setup

The library uses Tailwind CSS v4. The app needs the Tailwind Vite plugin:

```bash
npm install tailwindcss @tailwindcss/vite -w <app-name>
```

In `vite.config.ts`:

```ts
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
});
```

In the app's CSS entry file (`src/index.css`):

```css
@import "tailwindcss";
```

The library's components use `@tailwindcss/vite` — no manual `@apply` or config file needed.

### 4. Required dependencies

Minimum dependencies for the app to use UI components:

```json
{
    "dependencies": {
        "clsx": "^2.1.1",
        "lucide-react": "^0.562.0",
        "tailwindcss": "^4.1.17",
        "tw-animate-css": "^1.4.0"
    }
}
```

### 5. Optional: `file:` protocol dependency

Add a `file:` dependency in `package.json` for npm workspaces resolution (not required if vite aliases are set, but helps with IDE resolution):

```json
"dependencies": {
    "@mg-nx-forge/mg-ui-shadcn-4": "file:../../packages/mg-ui-shadcn-4"
}
```

## Usage

### Importing components

```tsx
import { Button } from '@mg-nx-forge/mg-ui-shadcn-4';
import { Toaster } from '@mg-nx-forge/mg-ui-shadcn-4';
```

### Deep imports from library source

```tsx
// Import a specific component directly from source
import { Button } from '@ui/components/ui/button';
```

### Using the TooltipProvider

The `TooltipProvider` should wrap your app (usually in `App.tsx`):

```tsx
import { TooltipProvider } from '@mg-nx-forge/mg-ui-shadcn-4';

export function App() {
    return (
        <TooltipProvider>
            <YourRoutes />
        </TooltipProvider>
    );
}
```

## Structure Reference

```
packages/mg-ui-shadcn-4/
├── src/
│   ├── index.ts                  — Public API exports
│   ├── components/
│   │   ├── ui/                   — shadcn/ui components (button, card, dialog, etc.)
│   │   └── form/                 — Form components (react-hook-form + zod)
│   └── registry/
│       └── icons/                — Icon loader with dynamic imports
├── package.json
├── tsconfig.json
└── project.json
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot find module '@mg-nx-forge/mg-ui-shadcn-4'` | Check vite.config.ts alias and tsconfig paths are set correctly |
| Components unstyled | Ensure `@tailwindcss/vite` plugin is in vite.config.ts and `@import "tailwindcss"` is in the CSS entry |
| `tw-animate-css` missing | Install `tw-animate-css` — required for animations |
| Duplicate React instance | Add `dedupe: ['react', 'react-dom']` to vite.config.ts `resolve` |
