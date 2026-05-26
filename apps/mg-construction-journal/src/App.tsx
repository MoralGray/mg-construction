import { initializeCurrentPage } from '@mg-nx-forge/mg-router-zustand-1';
import { ClickSpark, ThemeProvider, TooltipProvider } from '@mg-nx-forge/mg-ui-shadcn-4';
import { Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Header } from './components/Header';
import { HomePageSkeleton } from './components/HomePageSkeleton';
import { Masthead } from './components/Masthead';
import { pagesComponents, pagesInfo } from './services/pages.service';

export default function App() {
    useEffect(() => {
        initializeCurrentPage(pagesInfo);
    }, []);

    return (
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <TooltipProvider>
                <Header />
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: 'transparent',
                            border: '1px solid',
                            boxShadow: 'none',
                        },
                        classNames: {
                            success: '!border-green-500',
                            error: '!border-red-500',
                        },
                    }}
                />
                <Suspense
                    fallback={
                        <main className="mx-auto max-w-5xl px-4 py-8">
                            <Masthead />
                            <HomePageSkeleton />
                        </main>
                    }
                >
                    <Routes>
                        {pagesInfo.map((page) => {
                            const Component = pagesComponents[page.url];
                            return Component ? <Route key={page.url} path={page.url} element={<Component />} /> : null;
                        })}
                    </Routes>
                </Suspense>
            </TooltipProvider>
            <ClickSpark />
        </ThemeProvider>
    );
}
