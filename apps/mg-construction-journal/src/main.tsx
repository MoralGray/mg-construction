import { QueryProvider } from '@mg-nx-forge/mg-infinite-view-tanstack';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(
        <StrictMode>
            <QueryProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </QueryProvider>
        </StrictMode>
    );
}
