import { create } from 'zustand';

const STORAGE_KEY = 'mg-construction-journal-roads';

interface RoadsStore {
    selectedRoadIds: string[];
    setSelectedRoadIds: (ids: string[]) => void;
    toggleRoad: (id: string) => void;
}

function loadFromStorage(): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
        return [];
    }
}

function saveToStorage(ids: string[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export const useRoadsStore = create<RoadsStore>()((set) => ({
    selectedRoadIds: loadFromStorage(),
    setSelectedRoadIds: (ids) => {
        saveToStorage(ids);
        set({ selectedRoadIds: ids });
    },
    toggleRoad: (id) =>
        set((state) => {
            const next = state.selectedRoadIds.includes(id)
                ? state.selectedRoadIds.filter((rid) => rid !== id)
                : [...state.selectedRoadIds, id];
            saveToStorage(next);
            return { selectedRoadIds: next };
        }),
}));
