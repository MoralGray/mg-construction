import {
    Table as ShadcnTable,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@mg-nx-forge/mg-ui-shadcn-4';
import type { ColumnDef, Table } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type RefObject, useRef } from 'react';
import { cn } from '../utils';
import { TablePagination } from './TablePagination';
import { TableToolbar } from './TableToolbar';

interface DataTableProps<TData> {
    table: Table<TData>;
    columns: ColumnDef<TData>[];
    toolbar?: boolean;
    pagination?: boolean;
    className?: string;
    globalFilter?: string;
    onGlobalFilterChange?: (value: string) => void;
    virtualization?: boolean;
    virtualizedRows?: number;
    tableContainerRef?: RefObject<HTMLDivElement | null>;
    onRowClick?: (row: TData) => void;
}

export function DataTable<TData>({
    table,
    columns,
    toolbar = true,
    pagination = true,
    className,
    globalFilter = '',
    onGlobalFilterChange,
    onRowClick,
    virtualization = false,
    virtualizedRows = 0,
    tableContainerRef: externalRef,
}: DataTableProps<TData>) {
    const internalRef = useRef<HTMLDivElement>(null);
    const containerRef = externalRef || internalRef;
    const rows = table.getRowModel().rows;

    const virtualizer = useVirtualizer({
        count: virtualization ? rows.length : 0,
        getScrollElement: () => containerRef.current,
        estimateSize: () => 40,
        overscan: 10,
        enabled: virtualization,
    });

    return (
        <div className={cn('space-y-4', className)}>
            {toolbar && (
                <TableToolbar
                    table={table}
                    globalFilter={globalFilter}
                    setGlobalFilter={onGlobalFilterChange || (() => {})}
                />
            )}
            <div
                ref={containerRef}
                className={cn(
                    'relative overflow-auto',
                    virtualization && virtualizedRows > 0 && 'border rounded-md',
                    virtualization ? 'max-h-[600px]' : ''
                )}
            >
                <ShadcnTable>
                    <TableHeader className={virtualization ? 'sticky top-0 bg-background z-10' : ''}>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {virtualization && rows.length > 0 ? (
                            <>
                                {virtualizer.getVirtualItems().map((virtualItem) => {
                                    const row = rows[virtualItem.index];
                                    if (!row) {
                                        return null;
                                    }
                                    return (
                                        <TableRow
                                            key={row.id}
                                            style={{
                                                height: `${virtualItem.size}px`,
                                                transform: `translateY(${virtualItem.start}px)`,
                                            }}
                                            className="absolute w-full"
                                            onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    );
                                })}
                                <tr style={{ height: `${virtualizer.getTotalSize()}px` }} />
                            </>
                        ) : rows.length > 0 ? (
                            rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className={cn(onRowClick && 'cursor-pointer')}
                                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </ShadcnTable>
            </div>
            {pagination && !virtualization && <TablePagination table={table} />}
        </div>
    );
}
