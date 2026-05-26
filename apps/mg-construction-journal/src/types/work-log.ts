export interface WorkLogEntry {
    id: number;
    date: string;
    workTypeId: number;
    workTypeName: string;
    workTypeUnit: string;
    roadId: number;
    roadName: string;
    volume: number;
    executorName: string;
    description?: string;
    topicId?: number;
    workDone: boolean;
    workInProgress: boolean;
    workStopped: boolean;
    pinned: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
}

export interface WorkLogFilters {
    dateFrom?: string;
    dateTo?: string;
    roadId?: number;
    workTypeId?: number;
    sort?: 'date_desc' | 'date_asc';
    workTypeIds?: string[];
    search?: string;
    volumeFrom?: number;
    volumeTo?: number;
    roadIds?: number[];
    page?: number;
    limit?: number;
}
