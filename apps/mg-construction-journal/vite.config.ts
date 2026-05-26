import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// @ts-expect-error - Vite 8 + TS 5.9 incompatibility
export default defineConfig({
    // @ts-expect-error - Vite 8 + TS 5.9 incompatibility
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            '/api': {
                target: `http://localhost:${process.env.MG_CONSTRUCTION_JOURNAL_BACKEND_PORT}`,
                changeOrigin: true,
            },
        },
    },
    resolve: {
        alias: [
            {
                find: '@',
                replacement: path.resolve(__dirname, './src'),
            },
            {
                find: '@mg-nx-forge/mg-api-axios-1',
                replacement: path.resolve(__dirname, '../../packages/mg-api-axios-1/src/index.ts'),
            },
            {
                find: '@mg-nx-forge/mg-infinite-view-tanstack',
                replacement: path.resolve(__dirname, '../../packages/mg-infinite-view-tanstack/src/index.ts'),
            },
            {
                find: '@mg-nx-forge/mg-router-zustand-1',
                replacement: path.resolve(__dirname, '../../packages/mg-router-zustand-1/src/index.ts'),
            },
            {
                find: '@mg-nx-forge/mg-ui-shadcn-4/src',
                replacement: path.resolve(__dirname, '../../packages/mg-ui-shadcn-4/src'),
            },
            {
                find: '@mg-nx-forge/mg-ui-shadcn-4',
                replacement: path.resolve(__dirname, '../../packages/mg-ui-shadcn-4/src/index.ts'),
            },
        ],
        dedupe: ['react', 'react-dom'],
    },
});
