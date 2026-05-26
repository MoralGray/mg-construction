import {
    Badge,
    Button,
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
    ComboboxField,
    Form,
    Input,
    Label,
    PLFullBlock,
    RadioField,
    Separator,
    Switch,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@mg-nx-forge/mg-ui-shadcn-4';
import { Globe, Info, LogOut, Search, SlidersHorizontal, User } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Masthead } from '@/components/Masthead';
import RoadDetailModal from '@/components/RoadDetailModal';
import RoadStatsModal from '@/components/RoadStatsModal';
import type { Road, RoadType } from '@/config/roads';
import { fetchRoads } from '@/services/api.service';
import { useRoadsStore } from '@/stores/roads.store';

// # ------------------------------------------------------------------
// # Types
// # ------------------------------------------------------------------

type RoadSortOption = 'name_asc' | 'name_desc';

interface RoadFilterState {
    groupBy: string[];
    sort: RoadSortOption;
    filterRoadTypes: string[];
    isApplied: boolean;
}

interface RoadFilterFormData {
    groupBy: string[];
    sortOption: RoadSortOption;
    filterRoadTypes: string[];
}

// # ------------------------------------------------------------------
// # Constants
// # ------------------------------------------------------------------

const ROAD_TYPE_VARIANT: Record<RoadType, 'default' | 'secondary' | 'outline'> = {
    highway: 'default',
    urban: 'secondary',
    bridge: 'outline',
    tunnel: 'outline',
    other: 'secondary',
};

const ROAD_TYPE_OPTIONS = [
    { value: 'highway', label: 'Highway' },
    { value: 'urban', label: 'Urban' },
    { value: 'bridge', label: 'Bridge' },
    { value: 'tunnel', label: 'Tunnel' },
    { value: 'other', label: 'Other' },
];

const GROUP_OPTIONS = [{ value: 'roadType', label: 'Road Type' }];

const SORT_OPTIONS = [
    { value: 'name_asc', label: 'By name (A-Z)' },
    { value: 'name_desc', label: 'By name (Z-A)' },
];

const INITIAL_FILTER_STATE: RoadFilterState = {
    groupBy: ['roadType'],
    sort: 'name_asc',
    filterRoadTypes: [],
    isApplied: true,
};

// # ------------------------------------------------------------------
// # Utility
// # ------------------------------------------------------------------

function sortRoads(roads: Road[], sort: RoadSortOption): Road[] {
    return [...roads].sort((a, b) => {
        switch (sort) {
            case 'name_asc':
                return a.name.localeCompare(b.name);
            case 'name_desc':
                return b.name.localeCompare(a.name);
            default:
                return 0;
        }
    });
}

function groupRoads(roads: Road[], dimensions: string[]): Map<string, Road[]> {
    const groups = new Map<string, Road[]>();
    for (const road of roads) {
        const key = dimensions
            .map((d) => {
                if (d === 'roadType') {
                    return road.roadType;
                }
                return '';
            })
            .join(' > ');
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(road);
    }
    return groups;
}

// # ------------------------------------------------------------------
// # RoadFilterControls
// # ------------------------------------------------------------------

interface RoadFilterControlsProps {
    onApply: (data: RoadFilterFormData) => void;
    onClear: () => void;
    defaultValues: RoadFilterFormData;
}

function RoadFilterControls({ onApply, onClear, defaultValues }: RoadFilterControlsProps) {
    return (
        <div className="border bg-card p-4">
            <Form<RoadFilterFormData> onSubmit={onApply} defaultValues={defaultValues}>
                <div className="grid grid-cols-3 gap-6">
                    <div>
                        <h3 className="mb-2 text-sm font-semibold">Group</h3>
                        <ComboboxField
                            name="groupBy"
                            label="Group by"
                            options={GROUP_OPTIONS}
                            placeholder="Select dimensions..."
                        />
                    </div>

                    <div>
                        <h3 className="mb-2 text-sm font-semibold">Filter</h3>
                        <ComboboxField
                            name="filterRoadTypes"
                            label="Filter by road type"
                            options={ROAD_TYPE_OPTIONS}
                            placeholder="Select road types..."
                        />
                    </div>

                    <div>
                        <h3 className="mb-2 text-sm font-semibold">Sort</h3>
                        <RadioField name="sortOption" options={SORT_OPTIONS} />
                    </div>
                </div>

                <div className="mt-6 flex justify-center gap-2">
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
// # RoadCard
// # ------------------------------------------------------------------

interface RoadCardProps {
    road: Road;
    isSelected: boolean;
    onToggle: () => void;
    onInfo: () => void;
}

function RoadCard({ road, isSelected, onToggle, onInfo }: RoadCardProps) {
    return (
        <div className="flex gap-1 items-stretch">
            <Card
                className={`min-w-0 flex-1 cursor-pointer select-none transition-opacity ${isSelected ? '' : 'opacity-50'}`}
                onClick={onToggle}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <CardTitle className="truncate text-sm">{road.name}</CardTitle>
                            <Badge
                                variant={ROAD_TYPE_VARIANT[road.roadType] ?? 'secondary'}
                                className="h-4 px-1 py-0 text-[10px]"
                            >
                                {road.roadType}
                            </Badge>
                        </div>
                        <CardDescription className="text-[10px]">{road.slug}</CardDescription>
                    </div>
                    <Switch checked={isSelected} size="sm" className="pointer-events-none" />
                </CardHeader>
            </Card>
            <div className="flex flex-col gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="xs" variant="outline" className="flex-1" onClick={() => onInfo()}>
                            <Info className="size-3" />
                            Info
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Road statistics</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}

// # ------------------------------------------------------------------
// # RoadsTab
// # ------------------------------------------------------------------

function RoadsTab() {
    const selectedIds = useRoadsStore((s) => s.selectedRoadIds);
    const setSelectedRoadIds = useRoadsStore((s) => s.setSelectedRoadIds);
    const toggleRoad = useRoadsStore((s) => s.toggleRoad);
    const [roads, setRoads] = useState<Road[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterState, setFilterState] = useState<RoadFilterState>(INITIAL_FILTER_STATE);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const [modalRoad, setModalRoad] = useState<Road | null>(null);
    const [statsModalRoad, setStatsModalRoad] = useState<Road | null>(null);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setIsError(false);
        fetchRoads()
            .then((data) => {
                if (!cancelled) {
                    setRoads(data);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setIsError(true);
                    setIsLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const displayRoads = useMemo(() => {
        if (!roads) {
            return [];
        }
        let filtered = [...roads];

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            filtered = filtered.filter((r) => r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q));
        }

        if (filterState.isApplied && filterState.filterRoadTypes.length > 0) {
            filtered = filtered.filter((r) => filterState.filterRoadTypes.includes(r.roadType));
        }

        return sortRoads(filtered, filterState.sort);
    }, [roads, searchQuery, filterState]);

    const totalCount = roads?.length ?? 0;
    const selectedCount = selectedIds.length;
    const displayCount = displayRoads.length;

    const handleSelectAll = useCallback(() => {
        setSelectedRoadIds(displayRoads.map((r) => String(r.id)));
    }, [displayRoads, setSelectedRoadIds]);

    const handleDeselectAll = useCallback(() => {
        setSelectedRoadIds([]);
    }, [setSelectedRoadIds]);

    const handleTogglePanel = useCallback(() => {
        setIsPanelOpen((prev) => !prev);
        setFormKey((k) => k + 1);
    }, []);

    const handleApply = useCallback((data: RoadFilterFormData) => {
        setFilterState({
            groupBy: data.groupBy ?? [],
            sort: data.sortOption,
            filterRoadTypes: data.filterRoadTypes ?? [],
            isApplied: true,
        });
        setIsPanelOpen(false);
    }, []);

    const handleClear = useCallback(() => {
        setFilterState(INITIAL_FILTER_STATE);
        setIsPanelOpen(false);
    }, []);

    const shouldGroup = filterState.isApplied && filterState.groupBy.length > 0;

    const groupedRoads = useMemo(() => {
        if (!shouldGroup) {
            return null;
        }
        return groupRoads(displayRoads, filterState.groupBy);
    }, [displayRoads, shouldGroup, filterState.groupBy]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">Loading roads…</p>
            </div>
        );
    }

    if (isError || !roads) {
        return (
            <div className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">Failed to load roads. Try again later.</p>
            </div>
        );
    }

    return (
        <PLFullBlock>
            <p className="text-sm text-muted-foreground">
                View and select roads (construction objects) for your journal. Selected roads will be highlighted across
                the app.
            </p>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search roads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                    {selectedCount} of {totalCount} selected
                    {displayCount !== totalCount && <span> (filtered to {displayCount})</span>}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="xs" variant="outline" onClick={handleSelectAll}>
                        Select All
                    </Button>
                    <Button size="xs" variant="outline" onClick={handleDeselectAll}>
                        Deselect All
                    </Button>
                    <Button
                        size="xs"
                        variant={filterState.isApplied ? 'default' : 'outline'}
                        onClick={handleTogglePanel}
                    >
                        <SlidersHorizontal className="size-3" />
                        {filterState.isApplied ? 'Edit' : 'Filter/Group'}
                    </Button>
                </div>
            </div>

            {filterState.isApplied && (
                <div className="flex flex-wrap items-center gap-2">
                    {filterState.groupBy.map((dim) => (
                        <Badge key={dim}>Group: {dim === 'roadType' ? 'Road Type' : dim}</Badge>
                    ))}
                    {filterState.sort !== 'name_asc' && (
                        <Badge variant="secondary">
                            Sort: {SORT_OPTIONS.find((o) => o.value === filterState.sort)?.label}
                        </Badge>
                    )}
                    {filterState.filterRoadTypes.map((type) => (
                        <Badge key={type}>Filter: {type}</Badge>
                    ))}
                </div>
            )}

            {isPanelOpen && (
                <RoadFilterControls
                    key={`rfc-${formKey}`}
                    onApply={handleApply}
                    onClear={handleClear}
                    defaultValues={{
                        groupBy: filterState.groupBy,
                        sortOption: filterState.sort,
                        filterRoadTypes: filterState.filterRoadTypes,
                    }}
                />
            )}

            {displayRoads.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <p className="text-sm text-muted-foreground">No roads match your search.</p>
                </div>
            ) : shouldGroup && groupedRoads ? (
                <div className="space-y-6">
                    {Array.from(groupedRoads.entries()).map(([groupTitle, groupItems]) => (
                        <div key={groupTitle}>
                            <h3 className="mb-3 text-sm font-semibold capitalize">{groupTitle}</h3>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {groupItems.map((road) => {
                                    const isSelected = selectedIds.includes(String(road.id));
                                    return (
                                        <RoadCard
                                            key={road.id}
                                            road={road}
                                            isSelected={isSelected}
                                            onToggle={() => toggleRoad(String(road.id))}
                                            onInfo={() => setStatsModalRoad(road)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {displayRoads.map((road) => {
                        const isSelected = selectedIds.includes(String(road.id));
                        return (
                            <RoadCard
                                key={road.id}
                                road={road}
                                isSelected={isSelected}
                                onToggle={() => toggleRoad(String(road.id))}
                                onInfo={() => setModalRoad(road)}
                            />
                        );
                    })}
                </div>
            )}

            <RoadDetailModal
                road={modalRoad}
                open={modalRoad !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setModalRoad(null);
                    }
                }}
            />
            <RoadStatsModal
                road={statsModalRoad}
                open={statsModalRoad !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setStatsModalRoad(null);
                    }
                }}
            />
        </PLFullBlock>
    );
}

// # ------------------------------------------------------------------
// # AccountTab
// # ------------------------------------------------------------------

function AccountTab() {
    return (
        <PLFullBlock>
            <div className="grid gap-2">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                    <User className="size-4" />
                    Create account — unlock more
                </h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                    Sign up to save your roads, sync work logs across devices, and keep your filter state and
                    preferences between sessions. Get priority support and future features like team collaboration.
                </p>
                <div className="pt-1">
                    <Button disabled variant="default" size="sm">
                        Create account
                    </Button>
                    <span className="ml-3 text-[11px] text-muted-foreground">Coming in epic-2</span>
                </div>
            </div>

            <Separator />

            <div className="space-y-3">
                <h3 className="text-sm font-medium">Profile</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="display-name">Display name</Label>
                        <Input id="display-name" disabled placeholder="Coming in epic-2" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" disabled placeholder="Coming in epic-2" />
                    </div>
                </div>
            </div>

            <Separator />

            <div className="space-y-3">
                <h3 className="text-sm font-medium">Session</h3>
                <Button variant="outline" disabled>
                    <LogOut className="size-3.5" />
                    Logout
                </Button>
                <p className="text-[11px] text-muted-foreground">Auth features coming in epic-2.</p>
            </div>
        </PLFullBlock>
    );
}

// # ------------------------------------------------------------------
// # SettingsPage
// # ------------------------------------------------------------------

const SETTINGS_TABS = [
    { key: 'roads', label: 'Roads', icon: Globe },
    { key: 'account', label: 'Account', icon: User },
] as const;

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<string>('roads');
    const selectedCount = useRoadsStore((s) => s.selectedRoadIds.length);

    return (
        <main className="mx-auto max-w-5xl px-4 py-8">
            <Masthead />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="mb-6 flex justify-center">
                    <TabsList variant="line">
                        {SETTINGS_TABS.map((tab) => (
                            <TabsTrigger key={tab.key} value={tab.key}>
                                <tab.icon className="size-3.5" />
                                {tab.label}
                                {tab.key === 'roads' && selectedCount > 0 && (
                                    <Badge variant="secondary" className="ml-1.5 h-4 px-1 py-0 text-[10px]">
                                        {selectedCount}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="roads">
                    <RoadsTab />
                </TabsContent>
                <TabsContent value="account">
                    <AccountTab />
                </TabsContent>
            </Tabs>
        </main>
    );
}
