export type RoadType = 'highway' | 'urban' | 'bridge' | 'tunnel' | 'other';

export interface Road {
    id: number;
    name: string;
    slug: string;
    roadType: RoadType;
    description?: string;
}
