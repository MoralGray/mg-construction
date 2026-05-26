import type { ReactNode } from 'react';

export function Masthead({ children }: { children?: ReactNode }) {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <header className="mb-8 border-b-2 border-t-2 py-6 text-center">
            <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">CONSTRUCTION JOURNAL</h1>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs uppercase tracking-widest text-muted-foreground">
                <span>Est. 2026</span>
                <span className="h-3 w-px bg-border" />
                <span>{today}</span>
                {children}
            </div>
        </header>
    );
}
