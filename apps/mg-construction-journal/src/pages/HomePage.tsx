import { DataTable, useDataTable } from '@mg-nx-forge/mg-table-tanstack';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    Badge,
    Button,
    CheckboxField,
    ComboboxField,
    cn,
    Form,
    Input,
    InputField,
    PLFullBlock,
    RadioField,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Skeleton,
    Tabs,
    TabsList,
    TabsTrigger,
} from '@mg-nx-forge/mg-ui-shadcn-4';
import type { ColumnDef } from '@tanstack/react-table';
import {
    ChevronRight,
    CircleCheck,
    CircleDot,
    CircleStop,
    Pencil,
    Pin,
    PinOff,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Masthead } from '@/components/Masthead';
import WorkLogDetailModal from '@/components/WorkLogDetailModal';
import WorkLogEntryFormDialog from '@/components/WorkLogEntryFormDialog';
import { deleteWorkLogEntry, fetchWorkLogEntries, fetchWorkTypes, updateWorkLogEntry } from '@/services/api.service';
import type { FiltersState, GroupByOption } from '@/stores/filters.store';
import { useFiltersStore } from '@/stores/filters.store';
import { useRoadsStore } from '@/stores/roads.store';
import type { WorkLogEntry } from '@/types/work-log';

// # ------------------------------------------------------------------
// # Types
// # ------------------------------------------------------------------

type SortOption = 'date_desc' | 'date_asc';

interface FilterFormData {
    sortOption: SortOption;
    filterWorkTypeIds: string[];
    filterDateFrom: string;
    filterDateTo: string;
    volumeFrom: string;
    volumeTo: string;
    search?: string;
    workStatus: string;
    pinned: boolean;
    groupBy: GroupByOption;
}

// # ------------------------------------------------------------------
// # Constants
// # ------------------------------------------------------------------

const SORT_OPTIONS = [
    { value: 'date_desc', label: 'By date (newest first)' },
    { value: 'date_asc', label: 'By date (oldest first)' },
];

const WORK_STATUS_OPTIONS = [
    { value: '', label: 'Any' },
    { value: 'done', label: 'Work done' },
    { value: 'in_progress', label: 'Work in progress' },
    { value: 'stopped', label: 'Work is stopped' },
];

const GROUP_BY_OPTIONS: { value: GroupByOption; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'road', label: 'Road' },
    { value: 'workType', label: 'Work Type' },
    { value: 'status', label: 'Status' },
    { value: 'week', label: 'Week' },
];

const TAB_CONFIG: { value: string; label: string; filters: Partial<Record<string, boolean | undefined>> }[] = [
    { value: 'all', label: 'All', filters: {} },
    { value: 'pinned', label: 'Pinned', filters: { pinned: true } },
    { value: 'done', label: 'Done', filters: { workDone: true } },
    { value: 'in_progress', label: 'In Progress', filters: { workInProgress: true } },
    { value: 'stopped', label: 'Stopped', filters: { workStopped: true } },
];

function getWeekKey(dateStr: string): string {
    const d = new Date(`${dateStr}T00:00:00`);
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getGroupValue(entry: WorkLogEntry, groupBy: GroupByOption): string {
    switch (groupBy) {
        case 'road':
            return entry.roadName;
        case 'workType':
            return entry.workTypeName;
        case 'status':
            if (entry.workDone) {
                return 'Done';
            }
            if (entry.workInProgress) {
                return 'In Progress';
            }
            if (entry.workStopped) {
                return 'Stopped';
            }
            return 'None';
        case 'week':
            return getWeekKey(entry.date);
        default:
            return '';
    }
}

interface EntryGroup {
    key: string;
    label: string;
    entries: WorkLogEntry[];
    totalVolume: number;
    earliestDate: string;
    latestDate: string;
}

function buildGroups(entries: WorkLogEntry[], groupBy: GroupByOption): EntryGroup[] {
    const groupsMap = new Map<string, WorkLogEntry[]>();
    for (const entry of entries) {
        const key = getGroupValue(entry, groupBy);
        if (!groupsMap.has(key)) {
            groupsMap.set(key, []);
        }
        groupsMap.get(key)!.push(entry);
    }
    const groups: EntryGroup[] = [];
    for (const [key, groupEntries] of groupsMap.entries()) {
        let totalVolume = 0;
        let earliestDate = groupEntries[0].date;
        let latestDate = groupEntries[0].date;
        for (const e of groupEntries) {
            totalVolume += e.volume;
            if (e.date < earliestDate) {
                earliestDate = e.date;
            }
            if (e.date > latestDate) {
                latestDate = e.date;
            }
        }
        groups.push({ key, label: key, entries: groupEntries, totalVolume, earliestDate, latestDate });
    }
    const sortOrder: Record<GroupByOption, (a: EntryGroup, b: EntryGroup) => number> = {
        none: () => 0,
        road: (a, b) => a.label.localeCompare(b.label),
        workType: (a, b) => a.label.localeCompare(b.label),
        status: (a, b) => {
            const order = ['Done', 'In Progress', 'Stopped', 'None'];
            return order.indexOf(a.label) - order.indexOf(b.label);
        },
        week: (a, b) => b.label.localeCompare(a.label),
    };
    groups.sort(sortOrder[groupBy] || (() => 0));
    return groups;
}

// # ------------------------------------------------------------------
// # FilterControls
// # ------------------------------------------------------------------

interface FilterControlsProps {
    onApply: (data: FilterFormData) => void;
    onClear: () => void;
    defaultValues: FilterFormData;
    workTypeOptions: { value: string; label: string }[];
}

function FilterControls({
    onApply,
    onClear,
    defaultValues,
    workTypeOptions,
}: FilterControlsProps) {
    const searchRef = useRef<HTMLInputElement>(null);
    const [pendingGroupBy, setPendingGroupBy] = useState<GroupByOption>(defaultValues.groupBy);

    const handleSubmit = useCallback(
        (data: FilterFormData) => {
            const searchVal = searchRef.current?.value ?? '';
            onApply({ ...data, groupBy: pendingGroupBy, search: searchVal });
        },
        [onApply, pendingGroupBy]
    );

    return (
        <div className="mb-8 border bg-card p-4">
            <Form<FilterFormData> onSubmit={handleSubmit} defaultValues={defaultValues}>
                <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <h3 className="mb-2 text-sm font-semibold">Sort</h3>
                        <RadioField name="sortOption" options={SORT_OPTIONS} />
                        <h3 className="mb-2 mt-4 text-sm font-semibold">Status</h3>
                        <RadioField name="workStatus" options={WORK_STATUS_OPTIONS} />
                        <div className="mt-2">
                            <CheckboxField name="pinned" label="Pinned" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="mb-2 text-sm font-semibold">Filter</h3>
                        <ComboboxField
                            name="filterWorkTypeIds"
                            label="Filter by work type"
                            options={workTypeOptions}
                            placeholder="Select work types..."
                        />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="mb-2 text-sm font-semibold">Dates</h3>
                            <InputField name="filterDateFrom" label="Date from" type="date" />
                            <InputField name="filterDateTo" label="Date to" type="date" />
                        </div>
                        <div>
                            <h3 className="mb-2 text-sm font-semibold">Volume</h3>
                            <InputField name="volumeFrom" label="Volume from" type="number" min={0} />
                            <InputField name="volumeTo" label="Volume to" type="number" min={0} />
                        </div>
                    </div>
                </div>

                <div className="relative mt-4">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        ref={searchRef}
                        placeholder="Search by work type, executor, road..."
                        className="pl-8"
                        defaultValue={defaultValues.search ?? ''}
                    />
                </div>

                <div className="mt-6 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Group by:</span>
                        <Select value={pendingGroupBy} onValueChange={(v) => setPendingGroupBy(v as GroupByOption)}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {GROUP_BY_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" size="xs">
                        Apply
                    </Button>
                    <Button type="button" variant="outline" size="xs" onClick={onClear}>
                        Clear
                    </Button>
                </div>
            </Form>
        </div>
    );
}

// # ------------------------------------------------------------------
// # GroupTable
// # ------------------------------------------------------------------

const GROUP_PAGE_SIZE = 5;

interface GroupTableProps {
    entries: WorkLogEntry[];
    columns: ColumnDef<WorkLogEntry>[];
    onRowClick?: (entry: WorkLogEntry) => void;
}

function GroupTable({ entries, columns, onRowClick }: GroupTableProps) {
    const { table } = useDataTable({
        columns,
        data: entries,
        pageSize: GROUP_PAGE_SIZE,
        enablePagination: true,
        enableFilters: false,
        enableSorting: true,
    });

    return <DataTable table={table} columns={columns} toolbar={false} pagination onRowClick={onRowClick} />;
}

// # ------------------------------------------------------------------
// # GroupedDataTable
// # ------------------------------------------------------------------

interface GroupedDataTableProps {
    groups: EntryGroup[];
    columns: ColumnDef<WorkLogEntry>[];
    onRowClick?: (entry: WorkLogEntry) => void;
    collapsedGroups: Set<string>;
    onToggleGroup: (key: string) => void;
}

function GroupedDataTable({ groups, columns, onRowClick, collapsedGroups, onToggleGroup }: GroupedDataTableProps) {
    return (
        <div className="space-y-1">
            {groups.map((group) => {
                const isCollapsed = collapsedGroups.has(group.key);
                const earliest = new Date(`${group.earliestDate}T00:00:00`).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                });
                const latest = new Date(`${group.latestDate}T00:00:00`).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                });
                return (
                    <div key={group.key} className="overflow-hidden">
                        <button
                            type="button"
                            onClick={() => onToggleGroup(group.key)}
                            className="flex w-full items-center gap-2 border-b bg-muted/30 px-4 py-2 text-left text-sm font-semibold hover:bg-muted/50 transition-colors"
                        >
                            <span className="shrink-0 text-muted-foreground transition-transform duration-200">
                                <ChevronRight
                                    className={cn(
                                        'size-4 transition-transform duration-200',
                                        !isCollapsed && 'rotate-90'
                                    )}
                                />
                            </span>
                            <span>{group.label}</span>
                            <Badge variant="secondary" className="ml-1 text-xs">
                                {group.entries.length}
                            </Badge>
                            <span className="ml-auto hidden text-xs text-muted-foreground sm:block">
                                {group.totalVolume} vol &middot; {earliest} &ndash; {latest}
                            </span>
                        </button>
                        <div
                            className={cn(
                                'transition-all duration-200 ease-in-out overflow-hidden',
                                isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[9999px] opacity-100'
                            )}
                        >
                            <GroupTable entries={group.entries} columns={columns} onRowClick={onRowClick} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// # ------------------------------------------------------------------
// # Loading, Empty, Error states
// # ------------------------------------------------------------------

function LoadingSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
            ))}
        </div>
    );
}

function EmptyState({ hasRoads }: { hasRoads: boolean }) {
    if (!hasRoads) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <h2 className="mb-2 font-serif text-2xl font-bold">No Roads Configured</h2>
                <p className="mb-4 max-w-md text-sm text-muted-foreground">
                    No roads configured. Go to Settings to add one.
                </p>
                <Link to="/settings">
                    <Button variant="outline" size="sm">
                        Go to Settings
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="mb-2 font-serif text-2xl font-bold">No Work Log Entries</h2>
            <p className="max-w-md text-sm text-muted-foreground">
                There are no work log entries yet. Create one to get started.
            </p>
        </div>
    );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="mb-2 font-serif text-2xl font-bold">Failed to Load Entries</h2>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">
                An error occurred while fetching work log entries. Please try again.
            </p>
            <Button onClick={onRetry}>Retry</Button>
        </div>
    );
}

// # ------------------------------------------------------------------
// # HomePage
// # ------------------------------------------------------------------

export default function HomePage() {
    const filters = useFiltersStore((s) => s.filters);
    const setFilters = useFiltersStore((s) => s.setFilters);
    const clearFilters = useFiltersStore((s) => s.clearFilters);
    const setActiveTab = useFiltersStore((s) => s.setActiveTab);
    const selectedRoadIds = useRoadsStore((s) => s.selectedRoadIds);

    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [entries, setEntries] = useState<WorkLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [editingEntry, setEditingEntry] = useState<WorkLogEntry | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [workTypeOptions, setWorkTypeOptions] = useState<{ value: string; label: string }[]>([]);

    const isGrouping = filters.groupBy !== 'none';

    const groups = useMemo(() => {
        if (!isGrouping) {
            return [];
        }
        return buildGroups(entries, filters.groupBy);
    }, [entries, filters.groupBy, isGrouping]);

    const handleToggleGroup = useCallback((key: string) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }, []);

    useEffect(() => {
        fetchWorkTypes()
            .then((types) => {
                setWorkTypeOptions(types.map((t) => ({ value: String(t.id), label: t.name })));
            })
            .catch(() => {});
    }, []);

    const fetchEntries = useCallback(
        async (filtersParam?: {
            sort?: SortOption;
            workTypeIds?: string[];
            dateFrom?: string;
            dateTo?: string;
            search?: string;
            volumeFrom?: number;
            volumeTo?: number;
            roadIds?: string[];
            pinned?: boolean;
            workDone?: boolean;
            workInProgress?: boolean;
            workStopped?: boolean;
        }) => {
            setIsLoading(true);
            setIsError(false);
            try {
                const params: Record<string, unknown> = { limit: 1000 };
                if (filtersParam?.sort) {
                    params.sort = filtersParam.sort;
                }
                if (filtersParam?.workTypeIds && filtersParam.workTypeIds.length > 0) {
                    params.workTypeIds = filtersParam.workTypeIds;
                }
                if (filtersParam?.dateFrom) {
                    params.dateFrom = filtersParam.dateFrom;
                }
                if (filtersParam?.dateTo) {
                    params.dateTo = filtersParam.dateTo;
                }
                if (filtersParam?.search) {
                    params.search = filtersParam.search;
                }
                if (filtersParam?.volumeFrom !== undefined) {
                    params.volumeFrom = filtersParam.volumeFrom;
                }
                if (filtersParam?.volumeTo !== undefined) {
                    params.volumeTo = filtersParam.volumeTo;
                }
                if (filtersParam?.roadIds && filtersParam.roadIds.length > 0) {
                    params.roadIds = filtersParam.roadIds;
                }
                if (filtersParam?.pinned !== undefined) {
                    params.pinned = filtersParam.pinned;
                }
                if (filtersParam?.workDone !== undefined) {
                    params.workDone = filtersParam.workDone;
                }
                if (filtersParam?.workInProgress !== undefined) {
                    params.workInProgress = filtersParam.workInProgress;
                }
                if (filtersParam?.workStopped !== undefined) {
                    params.workStopped = filtersParam.workStopped;
                }
                const result = await fetchWorkLogEntries(params as Parameters<typeof fetchWorkLogEntries>[0]);
                setEntries(result.data);
            } catch {
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        if (selectedRoadIds.length === 0) {
            setEntries([]);
            setIsLoading(false);
            return;
        }
        if (filters.isApplied) {
            fetchEntries({
                sort: filters.sort,
                workTypeIds: filters.filterWorkTypeIds.length > 0 ? filters.filterWorkTypeIds.map(String) : undefined,
                dateFrom: filters.filterDateFrom || undefined,
                dateTo: filters.filterDateTo || undefined,
                search: filters.search || undefined,
                volumeFrom: filters.volumeFrom ? Number(filters.volumeFrom) : undefined,
                volumeTo: filters.volumeTo ? Number(filters.volumeTo) : undefined,
                roadIds: selectedRoadIds,
            });
        } else {
            fetchEntries({ roadIds: selectedRoadIds });
        }
    }, []);

    const handleDelete = useCallback(async () => {
        if (deleteConfirmId === null) {
            return;
        }
        try {
            await deleteWorkLogEntry(deleteConfirmId);
            setEntries((prev) => prev.filter((e) => e.id !== deleteConfirmId));
            toast.success('Entry deleted');
        } catch {
            toast.error('Failed to delete entry');
        } finally {
            setDeleteConfirmId(null);
        }
    }, [deleteConfirmId]);

    const handleTogglePanel = useCallback(() => {
        setIsPanelOpen((prev) => !prev);
        setFormKey((k) => k + 1);
    }, []);

    const handleApply = useCallback(
        (data: FilterFormData) => {
            const workStatus = data.workStatus ?? '';
            const pinned = data.pinned === true;

            const activeTab = workStatus === '' ? 'all' : workStatus;

            const newFilters: FiltersState = {
                ...filters,
                sort: data.sortOption,
                filterWorkTypeIds: (data.filterWorkTypeIds ?? []).map(Number),
                filterDateFrom: data.filterDateFrom ?? '',
                filterDateTo: data.filterDateTo ?? '',
                search: data.search ?? '',
                volumeFrom: data.volumeFrom ?? '',
                volumeTo: data.volumeTo ?? '',
                groupBy: data.groupBy,
                isApplied: true,
                activeTab,
                pinned,
                workDone: workStatus === 'done' ? true : undefined,
                workInProgress: workStatus === 'in_progress' ? true : undefined,
                workStopped: workStatus === 'stopped' ? true : undefined,
            };

            setFilters(newFilters);
            setCollapsedGroups(new Set());
            setActiveTab(activeTab);
            if (selectedRoadIds.length === 0) {
                setEntries([]);
                setIsLoading(false);
                return;
            }
            fetchEntries({
                sort: newFilters.sort,
                workTypeIds:
                    newFilters.filterWorkTypeIds.length > 0 ? newFilters.filterWorkTypeIds.map(String) : undefined,
                dateFrom: newFilters.filterDateFrom || undefined,
                dateTo: newFilters.filterDateTo || undefined,
                search: newFilters.search || undefined,
                volumeFrom: newFilters.volumeFrom ? Number(newFilters.volumeFrom) : undefined,
                volumeTo: newFilters.volumeTo ? Number(newFilters.volumeTo) : undefined,
                roadIds: selectedRoadIds,
                pinned: newFilters.pinned || undefined,
                workDone: newFilters.workDone,
                workInProgress: newFilters.workInProgress,
                workStopped: newFilters.workStopped,
            });
        },
        [fetchEntries, selectedRoadIds, setFilters, setActiveTab, filters]
    );

    const handleClear = useCallback(() => {
        clearFilters();
        setCollapsedGroups(new Set());
        setActiveTab('all');
        setIsPanelOpen(false);
        if (selectedRoadIds.length > 0) {
            fetchEntries({ roadIds: selectedRoadIds });
        } else {
            setEntries([]);
            setIsLoading(false);
        }
    }, [clearFilters, setCollapsedGroups, setActiveTab, fetchEntries, selectedRoadIds]);

    const handleRowClick = useCallback((entry: WorkLogEntry) => {
        setSelectedEntryId(entry.id);
    }, []);

    const handleEdit = useCallback((entry: WorkLogEntry) => {
        setEditingEntry(entry);
        setIsFormOpen(true);
    }, []);

    const handleAdd = useCallback(() => {
        setEditingEntry(null);
        setIsFormOpen(true);
    }, []);

    const handleFormSuccess = useCallback(() => {
        if (selectedRoadIds.length === 0) {
            setEntries([]);
            setIsLoading(false);
            return;
        }
        if (filters.isApplied) {
            fetchEntries({
                sort: filters.sort,
                workTypeIds: filters.filterWorkTypeIds.length > 0 ? filters.filterWorkTypeIds.map(String) : undefined,
                dateFrom: filters.filterDateFrom || undefined,
                dateTo: filters.filterDateTo || undefined,
                search: filters.search || undefined,
                volumeFrom: filters.volumeFrom ? Number(filters.volumeFrom) : undefined,
                volumeTo: filters.volumeTo ? Number(filters.volumeTo) : undefined,
                roadIds: selectedRoadIds,
            });
        } else {
            fetchEntries({ roadIds: selectedRoadIds });
        }
    }, [filters, selectedRoadIds, fetchEntries]);

    const handleCloseModal = useCallback((_open?: boolean) => {
        setSelectedEntryId(null);
    }, []);

    const selectedEntry = useMemo(
        () => entries.find((e) => e.id === selectedEntryId) ?? null,
        [entries, selectedEntryId]
    );

    const handleTogglePin = useCallback(async (entry: WorkLogEntry) => {
        try {
            const updated = await updateWorkLogEntry(entry.id, { pinned: !entry.pinned });
            setEntries((prev) => prev.map((e) => (e.id === entry.id ? updated : e)));
            toast.success(updated.pinned ? 'Entry pinned' : 'Entry unpinned');
        } catch {
            toast.error('Failed to update pin status');
        }
    }, []);

    const handleTabChange = useCallback(
        (tab: string) => {
            const config = TAB_CONFIG.find((t) => t.value === tab);
            if (!config) {
                return;
            }
            setActiveTab(tab);
            setFilters({
                ...filters,
                pinned: undefined,
                workDone: undefined,
                workInProgress: undefined,
                workStopped: undefined,
                ...config.filters,
                activeTab: tab,
                isApplied: true,
            });
            setFormKey((k) => k + 1);
            if (selectedRoadIds.length === 0) {
                setEntries([]);
                setIsLoading(false);
                return;
            }
            fetchEntries({
                sort: filters.sort,
                workTypeIds: filters.filterWorkTypeIds.length > 0 ? filters.filterWorkTypeIds.map(String) : undefined,
                dateFrom: filters.filterDateFrom || undefined,
                dateTo: filters.filterDateTo || undefined,
                search: filters.search || undefined,
                volumeFrom: filters.volumeFrom ? Number(filters.volumeFrom) : undefined,
                volumeTo: filters.volumeTo ? Number(filters.volumeTo) : undefined,
                roadIds: selectedRoadIds,
                ...config.filters,
            });
        },
        [filters, selectedRoadIds, fetchEntries, setFilters, setActiveTab]
    );

    const columns = useMemo<ColumnDef<WorkLogEntry>[]>(
        () => [
            {
                accessorKey: 'date',
                header: 'Date',
                enableSorting: true,
                cell: ({ row }) => {
                    const d = new Date(`${row.original.date}T00:00:00`);
                    return d.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    });
                },
            },
            {
                accessorKey: 'workTypeName',
                header: 'Work Type',
                enableSorting: true,
            },
            {
                id: 'volume',
                header: 'Volume',
                accessorFn: (row) => `${row.volume} ${row.workTypeUnit}`,
                enableSorting: true,
            },
            {
                accessorKey: 'executorName',
                header: 'Executor',
                enableSorting: true,
            },
            {
                accessorKey: 'roadName',
                header: 'Road',
                enableSorting: true,
            },
            {
                id: 'status',
                header: 'Status',
                cell: ({ row }) => {
                    const e = row.original;
                    return (
                        <div className="flex items-center gap-1.5">
                            {e.pinned && <Pin className="size-3 text-amber-600 fill-amber-600" aria-label="Pinned" />}
                            {e.workDone && <CircleCheck className="size-3.5 text-green-600" aria-label="Done" />}
                            {e.workInProgress && (
                                <CircleDot className="size-3.5 text-blue-600" aria-label="In progress" />
                            )}
                            {e.workStopped && <CircleStop className="size-3.5 text-red-600" aria-label="Stopped" />}
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                header: '',
                cell: ({ row }) => {
                    const e = row.original;
                    return (
                        <div className="flex justify-end gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={(ev) => {
                                    ev.stopPropagation();
                                    handleTogglePin(e);
                                }}
                                title={e.pinned ? 'Unpin' : 'Pin'}
                            >
                                {e.pinned ? <PinOff className="size-3 text-amber-600" /> : <Pin className="size-3" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={(ev) => {
                                    ev.stopPropagation();
                                    handleEdit(e);
                                }}
                            >
                                <Pencil className="size-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive"
                                onClick={(ev) => {
                                    ev.stopPropagation();
                                    setDeleteConfirmId(e.id);
                                }}
                            >
                                <Trash2 className="size-3" />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [handleEdit, handleTogglePin]
    );

    const { table, globalFilter, setGlobalFilter } = useDataTable({
        columns,
        data: entries,
        pageSize: 10,
        enableFilters: false,
        enableSorting: true,
    });

    function getDefaultFormValues(): FilterFormData {
        return {
            sortOption: filters.sort,
            filterWorkTypeIds: filters.filterWorkTypeIds.map(String),
            filterDateFrom: filters.filterDateFrom,
            filterDateTo: filters.filterDateTo,
            volumeFrom: filters.volumeFrom,
            volumeTo: filters.volumeTo,
            search: filters.search,
            workStatus: filters.activeTab === 'all' ? '' : filters.activeTab,
            pinned: filters.pinned ?? false,
            groupBy: filters.groupBy,
        };
    }

    const workTypeNameById = useMemo(() => {
        const map = new Map<number, string>();
        for (const opt of workTypeOptions) {
            map.set(Number(opt.value), opt.label);
        }
        return map;
    }, [workTypeOptions]);

    if (isError && entries.length === 0) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-8">
                <Masthead />
                <ErrorState
                    onRetry={() => {
                        if (filters.isApplied) {
                            handleApply(getDefaultFormValues());
                        } else if (selectedRoadIds.length > 0) {
                            fetchEntries({ roadIds: selectedRoadIds });
                        } else {
                            setEntries([]);
                            setIsLoading(false);
                        }
                    }}
                />
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-5xl px-4 py-8">
            <Masthead>
                <Button variant="outline" size="xs" onClick={handleAdd}>
                    <Plus className="size-3" /> New Entry
                </Button>
                <Button variant={filters.isApplied ? 'default' : 'outline'} size="xs" onClick={handleTogglePanel}>
                    <SlidersHorizontal className="size-3" />
                    {filters.isApplied ? 'Edit' : 'Filter'}
                </Button>
            </Masthead>

            {filters.isApplied && (
                <div className="-mt-6 mb-4 flex flex-wrap justify-center gap-2">
                    {filters.sort !== 'date_desc' && (
                        <Badge variant="secondary">
                            Sort: {SORT_OPTIONS.find((o) => o.value === filters.sort)?.label}
                        </Badge>
                    )}
                    {filters.filterWorkTypeIds.map((id) => (
                        <Badge key={id}>Filter: {workTypeNameById.get(id) ?? id}</Badge>
                    ))}
                    {filters.filterDateFrom && <Badge>From: {filters.filterDateFrom}</Badge>}
                    {filters.filterDateTo && <Badge>To: {filters.filterDateTo}</Badge>}
                    {filters.volumeFrom && <Badge>Vol &ge; {filters.volumeFrom}</Badge>}
                    {filters.volumeTo && <Badge>Vol &le; {filters.volumeTo}</Badge>}
                    {filters.search && <Badge>Search: {filters.search}</Badge>}
                    {filters.activeTab === 'done' && <Badge>Status: Done</Badge>}
                    {filters.activeTab === 'in_progress' && <Badge>Status: In Progress</Badge>}
                    {filters.activeTab === 'stopped' && <Badge>Status: Stopped</Badge>}
                    {filters.pinned && <Badge>Pinned</Badge>}
                    {filters.groupBy !== 'none' && (
                        <Badge>Group: {GROUP_BY_OPTIONS.find((o) => o.value === filters.groupBy)?.label}</Badge>
                    )}
                </div>
            )}

            <div className="mb-6 flex items-center justify-center">
                <Tabs value={filters.activeTab} onValueChange={handleTabChange}>
                    <TabsList>
                        {TAB_CONFIG.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value}>
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            {isPanelOpen && (
                <FilterControls
                    key={`fc-${formKey}`}
                    onApply={handleApply}
                    onClear={handleClear}
                    defaultValues={getDefaultFormValues()}
                    workTypeOptions={workTypeOptions}
                />
            )}

            {isLoading ? (
                <LoadingSkeleton />
            ) : entries.length === 0 ? (
                <EmptyState hasRoads={selectedRoadIds.length > 0} />
            ) : isGrouping ? (
                <GroupedDataTable
                    groups={groups}
                    columns={columns}
                    onRowClick={handleRowClick}
                    collapsedGroups={collapsedGroups}
                    onToggleGroup={handleToggleGroup}
                />
            ) : (
                <PLFullBlock>
                    <DataTable
                        table={table}
                        columns={columns}
                        toolbar={false}
                        pagination={true}
                        globalFilter={globalFilter}
                        onGlobalFilterChange={setGlobalFilter}
                        onRowClick={handleRowClick}
                    />
                </PLFullBlock>
            )}

            <WorkLogDetailModal
                entry={selectedEntry}
                open={selectedEntryId !== null}
                onOpenChange={handleCloseModal}
                onEntryUpdated={(updated) => {
                    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
                }}
            />

            <WorkLogEntryFormDialog
                open={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open);
                    if (!open) {
                        setEditingEntry(null);
                    }
                }}
                onSuccess={handleFormSuccess}
                entry={editingEntry}
            />

            <AlertDialog
                open={deleteConfirmId !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteConfirmId(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Work Log Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this entry? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
}
