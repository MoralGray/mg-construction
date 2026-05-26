import { ApiClient } from '@mg-nx-forge/mg-api-axios-1';
import type { Road } from '@/config/roads';
import type { RoadStats } from '@/types/road-stats';
import type { PaginatedResponse, WorkLogEntry } from '@/types/work-log';

const apiClient = new ApiClient('/api');
const API = apiClient.createApi({
    workLog: 'work-log',
    workTypes: 'work-types',
    roads: 'roads',
});

export async function fetchWorkLogEntries(params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    roadId?: number;
    workTypeId?: number;
    sort?: string;
    workTypeIds?: string[];
    search?: string;
    volumeFrom?: number;
    volumeTo?: number;
    roadIds?: string[];
    pinned?: boolean;
    workDone?: boolean;
    workInProgress?: boolean;
    workStopped?: boolean;
}): Promise<PaginatedResponse<WorkLogEntry>> {
    const filters: Record<string, string | number | boolean> = {};

    if (params) {
        if (params.page !== undefined) {
            filters.page = params.page;
        }
        if (params.limit !== undefined) {
            filters.limit = params.limit;
        }
        if (params.dateFrom) {
            filters.dateFrom = params.dateFrom;
        }
        if (params.dateTo) {
            filters.dateTo = params.dateTo;
        }
        if (params.roadId !== undefined) {
            filters.roadId = params.roadId;
        }
        if (params.workTypeId !== undefined) {
            filters.workTypeId = params.workTypeId;
        }
        if (params.sort) {
            filters.sort = params.sort;
        }
        if (params.workTypeIds && params.workTypeIds.length > 0) {
            filters.workTypeIds = params.workTypeIds.join(',');
        }
        if (params.search) {
            filters.search = params.search;
        }
        if (params.volumeFrom !== undefined) {
            filters.volumeFrom = params.volumeFrom;
        }
        if (params.volumeTo !== undefined) {
            filters.volumeTo = params.volumeTo;
        }
        if (params.roadIds && params.roadIds.length > 0) {
            filters.roadIds = params.roadIds.join(',');
        }
        if (params.pinned !== undefined) {
            filters.pinned = params.pinned;
        }
        if (params.workDone !== undefined) {
            filters.workDone = params.workDone;
        }
        if (params.workInProgress !== undefined) {
            filters.workInProgress = params.workInProgress;
        }
        if (params.workStopped !== undefined) {
            filters.workStopped = params.workStopped;
        }
    }

    const data = (await API.workLog.get({ filters })) as PaginatedResponse<WorkLogEntry>;
    return data;
}

export async function createWorkLogEntry(dto: {
    date: string;
    workTypeId: number;
    roadId: number;
    volume: number;
    executorName: string;
    description?: string;
    topicId?: number;
}): Promise<WorkLogEntry> {
    const data = (await API.workLog.post(dto)) as WorkLogEntry;
    return data;
}

export async function updateWorkLogEntry(
    id: number,
    dto: Partial<{
        date: string;
        workTypeId: number;
        roadId: number;
        volume: number;
        executorName: string;
        description: string;
        topicId: number;
        pinned: boolean;
    }>
): Promise<WorkLogEntry> {
    const data = (await API.workLog.put(dto, { id })) as WorkLogEntry;
    return data;
}

export async function deleteWorkLogEntry(id: number): Promise<void> {
    await API.workLog.del({ id });
}

export async function fetchRelatedWorkLogEntries(id: number): Promise<WorkLogEntry[]> {
    const data = (await API.workLog.get({ id: `${id}/related` })) as WorkLogEntry[];
    return data;
}

export async function fetchWorkTypes(): Promise<{ id: number; slug: string; name: string; unit: string }[]> {
    const { data } = (await API.workTypes.get()) as {
        data: { id: number; slug: string; name: string; unit: string }[];
    };
    return data;
}

export async function fetchRoads(): Promise<Road[]> {
    const { data } = (await API.roads.get()) as { data: Road[] };
    return data;
}

export async function fetchRoadStats(id: number): Promise<RoadStats> {
    const data = (await API.roads.get({ id: `${id}/stats` })) as RoadStats;
    return data;
}
