import {
    Badge,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    Input,
} from '@mg-nx-forge/mg-ui-shadcn-4';
import { Loader2, Pin, PinOff, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { fetchRelatedWorkLogEntries, updateWorkLogEntry } from '@/services/api.service';
import { useRoadsStore } from '@/stores/roads.store';
import type { WorkLogEntry } from '@/types/work-log';

interface WorkLogDetailModalProps {
    entry: WorkLogEntry | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEntryClick?: (id: number) => void;
    onRelatedEntriesFetched?: (entries: WorkLogEntry[]) => void;
    onEntryUpdated?: (entry: WorkLogEntry) => void;
}

export default function WorkLogDetailModal({
    entry,
    open,
    onOpenChange,
    onEntryClick,
    onRelatedEntriesFetched,
    onEntryUpdated,
}: WorkLogDetailModalProps) {
    const [relatedEntries, setRelatedEntries] = useState<WorkLogEntry[]>([]);
    const [isLoadingRelated, setIsLoadingRelated] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const selectedRoadIds = useRoadsStore((s) => s.selectedRoadIds);

    const entriesBySelectedRoads = useMemo(() => {
        if (selectedRoadIds.length === 0) {
            return [];
        }
        const ids = new Set(selectedRoadIds.map(Number));
        return relatedEntries.filter((r) => ids.has(r.roadId));
    }, [relatedEntries, selectedRoadIds]);

    const filteredEntries = useMemo(() => {
        const source = entriesBySelectedRoads;
        if (!searchQuery.trim()) {
            return source;
        }
        const q = searchQuery.toLowerCase();
        return source.filter(
            (r) =>
                r.roadName.toLowerCase().includes(q) ||
                r.executorName.toLowerCase().includes(q) ||
                r.date.includes(q) ||
                String(r.volume).includes(q) ||
                r.workTypeName.toLowerCase().includes(q) ||
                r.workTypeUnit.toLowerCase().includes(q)
        );
    }, [entriesBySelectedRoads, searchQuery]);

    const fetchRelated = useCallback(async () => {
        if (!entry?.topicId) {
            setRelatedEntries([]);
            return;
        }

        setIsLoadingRelated(true);
        try {
            const data = await fetchRelatedWorkLogEntries(entry.id);
            setRelatedEntries(data);
            onRelatedEntriesFetched?.(data);
        } catch {
            setRelatedEntries([]);
        } finally {
            setIsLoadingRelated(false);
        }
    }, [entry, onRelatedEntriesFetched]);

    useEffect(() => {
        if (open && entry) {
            fetchRelated();
        }
    }, [open, entry, fetchRelated]);

    const handleTogglePin = useCallback(async () => {
        if (!entry) {
            return;
        }
        try {
            const updated = await updateWorkLogEntry(entry.id, { pinned: !entry.pinned });
            onEntryUpdated?.(updated);
            toast.success(updated.pinned ? 'Entry pinned' : 'Entry unpinned');
        } catch {
            toast.error('Failed to update pin status');
        }
    }, [entry, onEntryUpdated]);

    if (!entry) {
        return null;
    }

    const hasRelated = entry.topicId != null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[60vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[11px] uppercase tracking-widest text-muted-foreground/70">
                            {entry.workTypeName}
                        </span>
                        <span className="text-[11px] text-muted-foreground/50">|</span>
                        <span className="text-[11px] text-muted-foreground/70">{entry.date}</span>
                        <span className="text-[11px] text-muted-foreground/50">|</span>
                        <span className="text-[11px] text-muted-foreground/70">{entry.roadName}</span>
                    </div>
                    <DialogTitle className="font-serif text-xl font-bold leading-tight">
                        {entry.volume} {entry.workTypeUnit} &mdash; {entry.executorName}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {entry.description ?? 'No additional details.'}
                    </DialogDescription>
                    <div className="mt-3 flex flex-wrap items-center gap-1">
                        {entry.pinned && (
                            <Badge
                                variant="outline"
                                className="text-amber-600 border-amber-300 text-xs flex items-center gap-1"
                            >
                                <Pin className="size-3" /> Pinned
                            </Badge>
                        )}
                        {entry.workDone && (
                            <Badge variant="default" className="bg-green-600 text-xs">
                                Done
                            </Badge>
                        )}
                        {entry.workInProgress && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                In Progress
                            </Badge>
                        )}
                        {entry.workStopped && (
                            <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                                Stopped
                            </Badge>
                        )}
                        <button
                            type="button"
                            onClick={handleTogglePin}
                            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            title={entry.pinned ? 'Unpin' : 'Pin'}
                        >
                            {entry.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                            {entry.pinned ? 'Unpin' : 'Pin'}
                        </button>
                    </div>
                </DialogHeader>

                {hasRelated && (
                    <div className="border-t pt-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Related entries &mdash; Task #{entry.topicId}
                                {!isLoadingRelated && (
                                    <span className="ml-1.5 text-muted-foreground/60">({filteredEntries.length})</span>
                                )}
                            </h4>
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/60" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="h-7 w-40 pl-6 text-xs"
                                />
                            </div>
                        </div>

                        {isLoadingRelated ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredEntries.length > 0 ? (
                            <div className="space-y-3 pr-1 max-h-100 overflow-y-auto">
                                {filteredEntries.map((related) => (
                                    <div
                                        key={related.id}
                                        className="flex cursor-pointer items-start gap-3 border p-3 transition-colors hover:bg-accent/50"
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEntryClick?.(related.id);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onEntryClick?.(related.id);
                                            }
                                        }}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium leading-snug">
                                                {related.roadName} &mdash; {related.volume} {related.workTypeUnit}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {related.executorName} &middot; {related.date}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                {searchQuery ? 'No matching entries.' : 'No other entries for this task.'}
                            </p>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
