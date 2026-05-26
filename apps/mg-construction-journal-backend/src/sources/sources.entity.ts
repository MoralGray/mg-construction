export type SourceCategory = 'left' | 'right' | 'neutral';

export interface Source {
    id: string;
    name: string;
    feedUrl: string;
    logoUrl?: string;
    category: SourceCategory;
    popularity: number;
}
