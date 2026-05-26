import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Form,
    InputField,
    RadioField,
    SelectField,
    TextareaField,
} from '@mg-nx-forge/mg-ui-shadcn-4';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import type { Road } from '@/config/roads';
import { createWorkLogEntry, fetchRoads, fetchWorkTypes, updateWorkLogEntry } from '@/services/api.service';
import type { WorkLogEntry } from '@/types/work-log';

interface WorkLogEntryFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    entry?: WorkLogEntry | null;
}

interface WorkTypeOption {
    id: number;
    slug: string;
    name: string;
    unit: string;
}

interface FormValues {
    date: string;
    workTypeId: string;
    roadId: string;
    volume: string;
    executorName: string;
    description?: string;
    topicId?: number;
    workStatus: string;
}

const WORK_STATUS_OPTIONS = [
    { value: '', label: 'None' },
    { value: 'done', label: 'Work done' },
    { value: 'in_progress', label: 'Work in progress' },
    { value: 'stopped', label: 'Work is stopped' },
];

const formSchema = z.object({
    date: z.string().min(1, 'Date is required'),
    workTypeId: z.string().min(1, 'Work type is required'),
    roadId: z.string().min(1, 'Road is required'),
    volume: z
        .string()
        .min(1, 'Volume is required')
        .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Volume must be a positive number'),
    executorName: z.string().min(1, 'Executor name is required'),
    description: z.string().optional(),
    topicId: z.coerce.number().int().optional(),
    workStatus: z.string(),
});

export default function WorkLogEntryFormDialog({ open, onOpenChange, onSuccess, entry }: WorkLogEntryFormDialogProps) {
    const [workTypes, setWorkTypes] = useState<WorkTypeOption[]>([]);
    const [roads, setRoads] = useState<Road[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);

    const isEdit = entry != null;

    useEffect(() => {
        if (!open) {
            return;
        }
        let cancelled = false;
        setIsLoadingOptions(true);
        Promise.all([fetchWorkTypes(), fetchRoads()])
            .then(([wt, r]) => {
                if (!cancelled) {
                    setWorkTypes(wt);
                    setRoads(r);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    toast.error('Failed to load form options');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoadingOptions(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [open]);

    const workTypeOptions = workTypes.map((wt) => ({
        value: String(wt.id),
        label: `${wt.name} (${wt.unit})`,
    }));

    const roadOptions = roads.map((r) => ({
        value: String(r.id),
        label: r.name,
    }));

    const defaultValues: FormValues = {
        date: entry?.date ?? '',
        workTypeId: entry ? String(entry.workTypeId) : '',
        roadId: entry ? String(entry.roadId) : '',
        volume: entry ? String(entry.volume) : '',
        executorName: entry?.executorName ?? '',
        description: entry?.description ?? '',
        topicId: entry?.topicId ?? undefined,
        workStatus: entry?.workDone
            ? 'done'
            : entry?.workInProgress
              ? 'in_progress'
              : entry?.workStopped
                ? 'stopped'
                : '',
    };

    const handleSubmit = useCallback(
        async (data: FormValues) => {
            try {
                const dto = {
                    date: data.date,
                    workTypeId: Number(data.workTypeId),
                    roadId: Number(data.roadId),
                    volume: Number(data.volume),
                    executorName: data.executorName,
                    description: data.description || undefined,
                    topicId: data.topicId ?? undefined,
                    workDone: data.workStatus === 'done',
                    workInProgress: data.workStatus === 'in_progress',
                    workStopped: data.workStatus === 'stopped',
                };
                if (isEdit && entry) {
                    await updateWorkLogEntry(entry.id, dto);
                    toast.success('Entry updated');
                } else {
                    await createWorkLogEntry(dto);
                    toast.success('Entry created');
                }
                onOpenChange(false);
                onSuccess();
            } catch {
                toast.error(isEdit ? 'Failed to update entry' : 'Failed to create entry');
            }
        },
        [isEdit, entry, onOpenChange, onSuccess]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Work Log Entry' : 'New Work Log Entry'}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'Update the details of this work log entry.'
                            : 'Fill in the details to record a new work log entry.'}
                    </DialogDescription>
                </DialogHeader>

                <Form<FormValues>
                    schema={formSchema}
                    defaultValues={defaultValues}
                    onSubmit={handleSubmit}
                    key={`form-${entry?.id ?? 'new'}-${open}`}
                >
                    <div className="space-y-4">
                        <InputField name="date" label="Date" type="date" required />
                        <SelectField
                            name="workTypeId"
                            label="Work Type"
                            placeholder={isLoadingOptions ? 'Loading...' : 'Select work type...'}
                            options={workTypeOptions}
                            required
                            disabled={isLoadingOptions}
                        />
                        <SelectField
                            name="roadId"
                            label="Road"
                            placeholder={isLoadingOptions ? 'Loading...' : 'Select road...'}
                            options={roadOptions}
                            required
                            disabled={isLoadingOptions}
                        />
                        <InputField name="volume" label="Volume" type="number" step="any" required />
                        <InputField name="executorName" label="Executor Name" placeholder="Full name" required />
                        <TextareaField
                            name="description"
                            label="Description"
                            placeholder="Optional notes..."
                            rows={3}
                        />
                        <InputField
                            name="topicId"
                            label="Task ID"
                            type="number"
                            placeholder="Optional task grouping ID"
                        />
                        <div className="space-y-2 border-t pt-4">
                            <h4 className="text-sm font-semibold">Work Status</h4>
                            <RadioField name="workStatus" options={WORK_STATUS_OPTIONS} />
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoadingOptions}>
                            {isEdit ? 'Save Changes' : 'Create Entry'}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
