import {
    type ColumnDef,
    type ColumnFiltersState,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type PaginationState,
    type SortingState,
    type Table,
    useReactTable,
    type VisibilityState,
} from '@tanstack/react-table';
import { useState } from 'react';

export interface UseDataTableOptions<TData> {
    columns: ColumnDef<TData>[];
    data: TData[];
    pageSize?: number;
    enableSorting?: boolean;
    enableFilters?: boolean;
    enablePagination?: boolean;
    enableVirtualization?: boolean;
    enableRowSelection?: boolean;
}

export interface UseDataTableReturn<TData> {
    table: Table<TData>;
    globalFilter: string;
    setGlobalFilter: (value: string) => void;
}

export function useDataTable<TData>({
    columns,
    data,
    pageSize = 10,
    enableSorting = true,
    enableFilters = true,
    enablePagination = true,
    enableVirtualization = false,
    enableRowSelection = false,
}: UseDataTableOptions<TData>): UseDataTableReturn<TData> {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize,
    });

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
            rowSelection,
            pagination: enablePagination ? pagination : undefined,
        },
        enableRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: enablePagination ? setPagination : undefined,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: enableFilters ? getFilteredRowModel() : undefined,
        getPaginationRowModel: enablePagination && !enableVirtualization ? getPaginationRowModel() : undefined,
        getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
        getFacetedRowModel: enableFilters ? getFacetedRowModel() : undefined,
        getFacetedUniqueValues: enableFilters ? getFacetedUniqueValues() : undefined,
        autoResetPageIndex: false,
    });

    return {
        table,
        globalFilter,
        setGlobalFilter,
    };
}
