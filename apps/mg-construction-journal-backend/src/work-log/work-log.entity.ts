export interface WorkLogEntryItem {
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
