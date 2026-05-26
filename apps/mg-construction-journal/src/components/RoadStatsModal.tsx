import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@mg-nx-forge/mg-ui-shadcn-4';
import { CircleCheck, CircleDot, CircleStop } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Road } from '@/config/roads';
import { fetchRoadStats } from '@/services/api.service';
import type { RoadStats } from '@/types/road-stats';

const COLORS = {
    done: '#22c55e',
    inProgress: '#3b82f6',
    stopped: '#ef4444',
};

interface RoadStatsModalProps {
    road: Road | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function DonutChart({ stats }: { stats: RoadStats }) {
    const { workDone, workInProgress, workStopped } = stats.statusDistribution;
    const total = workDone + workInProgress + workStopped;

    if (total === 0) {
        return (
            <div className="flex items-center justify-center">
                <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="60" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                    <text
                        x="80"
                        y="80"
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-muted-foreground text-xs"
                    >
                        No data
                    </text>
                </svg>
            </div>
        );
    }

    const segments = [
        { value: workDone, color: COLORS.done, label: 'Done' },
        { value: workInProgress, color: COLORS.inProgress, label: 'In progress' },
        { value: workStopped, color: COLORS.stopped, label: 'Stopped' },
    ].filter((s) => s.value > 0);

    const radius = 60;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;
    const slices = segments.map((seg) => {
        const length = (seg.value / total) * circumference;
        const startOffset = offset;
        offset += length;
        return { ...seg, length, startOffset };
    });

    return (
        <div className="flex items-center justify-center">
            <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
                {slices.map((seg) => (
                    <circle
                        key={seg.label}
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="20"
                        strokeDasharray={`${seg.length} ${circumference - seg.length}`}
                        strokeDashoffset={-seg.startOffset}
                    />
                ))}
                <circle cx="80" cy="80" r="30" fill="var(--background)" />
            </svg>
        </div>
    );
}

export default function RoadStatsModal({ road, open, onOpenChange }: RoadStatsModalProps) {
    const [stats, setStats] = useState<RoadStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!open || !road) {
            return;
        }
        setIsLoading(true);
        fetchRoadStats(road.id)
            .then(setStats)
            .catch(() => setStats(null))
            .finally(() => setIsLoading(false));
    }, [open, road]);

    if (!road) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl font-bold leading-tight">{road.name}</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-muted-foreground">Loading stats...</p>
                    </div>
                ) : stats ? (
                    <div className="space-y-6">
                        <DonutChart stats={stats} />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Total entries</span>
                                <span className="font-semibold">{stats.entryCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Total volume</span>
                                <span className="font-semibold">{stats.totalVolume.toFixed(1)}</span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm">
                                <CircleCheck className="size-3.5 text-green-500" />
                                <span className="text-muted-foreground">Done</span>
                                <span className="ml-auto font-medium">{stats.statusDistribution.workDone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CircleDot className="size-3.5 text-blue-500" />
                                <span className="text-muted-foreground">In progress</span>
                                <span className="ml-auto font-medium">{stats.statusDistribution.workInProgress}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CircleStop className="size-3.5 text-red-500" />
                                <span className="text-muted-foreground">Stopped</span>
                                <span className="ml-auto font-medium">{stats.statusDistribution.workStopped}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-muted-foreground">Failed to load stats.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
