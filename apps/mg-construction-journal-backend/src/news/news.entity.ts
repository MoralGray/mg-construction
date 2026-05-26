export interface NewsItem {
    id: number;
    title: string;
    description: string;
    content: string;
    category: string;
    popularity: number;
    date: string;
    source: string;
    topicId?: number;
}

export interface GetAllParams {
    page: number;
    limit: number;
    categories?: string[];
    date?: string;
    sort?: 'date_desc' | 'popularity_desc';
    dateRange?: 'day' | 'week' | 'month' | 'year';
    sources?: string[];
}
