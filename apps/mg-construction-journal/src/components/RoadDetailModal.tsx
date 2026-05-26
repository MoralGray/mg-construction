import {
    Badge,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@mg-nx-forge/mg-ui-shadcn-4';
import type { Road, RoadType } from '@/config/roads';

interface RoadDetailModalProps {
    road: Road | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ROAD_TYPE_VARIANT: Record<RoadType, 'default' | 'secondary' | 'outline'> = {
    highway: 'default',
    urban: 'secondary',
    bridge: 'outline',
    tunnel: 'outline',
    other: 'secondary',
};

export default function RoadDetailModal({ road, open, onOpenChange }: RoadDetailModalProps) {
    if (!road) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Badge
                            variant={ROAD_TYPE_VARIANT[road.roadType] ?? 'secondary'}
                            className="rounded-none px-2 py-0.5 text-xs font-medium"
                        >
                            {road.roadType}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground/50">|</span>
                        <span className="text-[11px] uppercase tracking-widest text-muted-foreground/70">
                            {road.slug}
                        </span>
                    </div>
                    <DialogTitle className="font-serif text-xl font-bold leading-tight">{road.name}</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {road.description ?? 'No description available.'}
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
