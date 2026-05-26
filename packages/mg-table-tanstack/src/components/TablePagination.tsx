import { Button } from '@mg-nx-forge/mg-ui-shadcn-4';
import type { Table } from '@tanstack/react-table';

interface TablePaginationProps<TData> {
    table: Table<TData>;
}

export function TablePagination<TData>({ table }: TablePaginationProps<TData>) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                >
                    First
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Prev
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    Next
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                >
                    Last
                </Button>
            </div>
            <select
                className="h-8 rounded border px-2 text-xs"
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
                {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                        {size} / page
                    </option>
                ))}
            </select>
        </div>
    );
}
