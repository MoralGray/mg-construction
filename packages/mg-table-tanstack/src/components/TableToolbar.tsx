import { Input } from '@mg-nx-forge/mg-ui-shadcn-4';
import type { Table } from '@tanstack/react-table';

interface TableToolbarProps<TData> {
    table: Table<TData>;
    globalFilter: string;
    setGlobalFilter: (value: string) => void;
}

export function TableToolbar<TData>({ table, globalFilter, setGlobalFilter }: TableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0 || globalFilter !== '';

    return (
        <div className="flex items-center justify-between gap-4">
            <Input
                placeholder="Search all columns..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="max-w-sm"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length > 0 && (
                    <span>{table.getFilteredSelectedRowModel().rows.length} selected</span>
                )}
                <span>{table.getFilteredRowModel().rows.length} rows</span>
                {isFiltered && (
                    <button
                        type="button"
                        className="underline"
                        onClick={() => {
                            table.resetColumnFilters();
                            setGlobalFilter('');
                        }}
                    >
                        Clear filters
                    </button>
                )}
            </div>
        </div>
    );
}
