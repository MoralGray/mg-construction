import { create } from 'zustand';

export type GroupByOption = 'none' | 'road' | 'workType' | 'status' | 'week';

export interface FiltersState {
    sort: 'date_desc' | 'date_asc';
    filterWorkTypeIds: number[];
    filterDateFrom: string;
    filterDateTo: string;
    search: string;
    volumeFrom: string;
    volumeTo: string;
    isApplied: boolean;
    activeTab: string;
    pinned?: boolean;
    workDone?: boolean;
    workInProgress?: boolean;
    workStopped?: boolean;
    groupBy: GroupByOption;
}

interface FiltersStore {
    filters: FiltersState;
    setFilters: (filters: FiltersState) => void;
    clearFilters: () => void;
    setActiveTab: (tab: string) => void;
    setGroupBy: (value: GroupByOption) => void;
}

const INITIAL_FILTERS: FiltersState = {
    sort: 'date_desc',
    filterWorkTypeIds: [],
    filterDateFrom: '',
    filterDateTo: '',
    search: '',
    volumeFrom: '',
    volumeTo: '',
    isApplied: false,
    activeTab: 'all',
    pinned: undefined,
    workDone: undefined,
    workInProgress: undefined,
    workStopped: undefined,
    groupBy: 'none',
};

export const useFiltersStore = create<FiltersStore>()((set) => ({
    filters: { ...INITIAL_FILTERS },
    setFilters: (filters) => set({ filters }),
    clearFilters: () => set({ filters: { ...INITIAL_FILTERS } }),
    setActiveTab: (tab) => set((state) => ({ filters: { ...state.filters, activeTab: tab } })),
    setGroupBy: (value) => {
        set((state) => ({ filters: { ...state.filters, groupBy: value } }));
    },
}));
