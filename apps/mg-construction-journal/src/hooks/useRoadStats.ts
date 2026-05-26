import { useEffect, useState } from 'react';
import { fetchRoadStats } from '@/services/api.service';
import type { RoadStats } from '@/types/road-stats';

interface UseRoadStatsResult {
    stats: RoadStats | null;
    isLoading: boolean;
    error: boolean;
}

export function useRoadStats(id: number | undefined): UseRoadStatsResult {
    const [stats, setStats] = useState<RoadStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (id === undefined) {
            setStats(null);
            setIsLoading(false);
            setError(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(false);

        fetchRoadStats(id)
            .then((data) => {
                if (!cancelled) {
                    setStats(data);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError(true);
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    return { stats, isLoading, error };
}
