import { type FieldError, useFormContext } from 'react-hook-form';

import { cn } from '../../lib/utils';
import { Label } from '../ui/label';
import type { FieldWrapperProps } from './types';

// Error message component
export function ErrorMessage({
    error,
    message,
    className,
}: {
    error?: FieldError;
    message?: string;
    className?: string;
}) {
    if (!error && !message) {
        return null;
    }

    const errorMessage = error?.message || message;
    if (!errorMessage) {
        return null;
    }

    return <p className={cn('text-sm text-destructive mt-1', className)}>{errorMessage}</p>;
}

// Field wrapper component
export function FormField({ name, label, description, children, className, required = false }: FieldWrapperProps) {
    const {
        formState: { errors },
    } = useFormContext();

    const error = errors[name] as FieldError | undefined;

    return (
        <div className={cn('grid gap-2', className)} data-invalid={!!error || undefined}>
            {label && (
                <Label
                    htmlFor={name}
                    className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}
                >
                    {label}
                </Label>
            )}
            {children}
            {description && (
                <p id={`${name}-description`} className="text-sm text-muted-foreground">
                    {description}
                </p>
            )}
            <ErrorMessage error={error} />
        </div>
    );
}
