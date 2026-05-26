const skeletonTemplate = {
    gridTemplateColumns: '1fr 1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    cells: Array.from({ length: 6 }, (_, i) => ({
        gridColumn: `${(i % 3) + 1} / ${(i % 3) + 2}`,
        gridRow: `${Math.floor(i / 3) + 1} / ${Math.floor(i / 3) + 2}`,
        size: 'standard' as const,
    })),
};

export function HomePageSkeleton() {
    const template = skeletonTemplate;

    return (
        <div
            className="grid animate-pulse gap-4"
            style={{
                gridTemplateColumns: template.gridTemplateColumns,
                gridTemplateRows: template.gridTemplateRows,
            }}
        >
            {template.cells.map((cell) => (
                <div
                    key={`skel-${cell.gridColumn}-${cell.gridRow}`}
                    className="flex flex-col gap-3 border bg-card p-4"
                    style={{ gridColumn: cell.gridColumn, gridRow: cell.gridRow }}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="h-5 flex-1 rounded bg-muted" />
                        <div className="h-4 w-16 rounded bg-muted" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-full rounded bg-muted" />
                        <div className="h-3 w-5/6 rounded bg-muted" />
                        <div className="h-3 w-4/6 rounded bg-muted" />
                    </div>
                    <div className="h-3 w-24 rounded bg-muted" />
                </div>
            ))}
        </div>
    );
}
