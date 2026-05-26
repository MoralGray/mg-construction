import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { type DefaultValues, type FieldValues, FormProvider, type UseFormReturn, useForm } from 'react-hook-form';

import { cn } from '../../lib/utils';
import type { FormProps } from './types';

// Create a form context for type-safe access
const FormContext = React.createContext<UseFormReturn<FieldValues> | null>(null);

export function useFormContext<T extends FieldValues>() {
    const context = React.useContext(FormContext as React.Context<UseFormReturn<T> | null>);
    if (!context) {
        throw new Error('useFormContext must be used within a Form component');
    }
    return context;
}

export function Form<T extends FieldValues>({
    onSubmit,
    defaultValues,
    schema,
    children,
    className,
    onSuccess,
    onError,
}: FormProps<T>) {
    const form = useForm<T>({
        defaultValues: defaultValues as DefaultValues<T>,
        resolver: schema ? zodResolver(schema) : undefined,
        mode: 'onChange',
    });

    const handleSubmit = React.useCallback(
        async (data: T) => {
            try {
                await onSubmit(data);
                onSuccess?.();
            } catch (error) {
                console.error('Form submission error:', error);
                onError?.(form.formState.errors as Record<string, import('react-hook-form').FieldError>);
            }
        },
        [onSubmit, onSuccess, onError, form.formState.errors]
    );

    return (
        <FormProvider {...form}>
            <FormContext.Provider value={form as UseFormReturn<FieldValues>}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className={cn('space-y-6', className)} noValidate>
                    {children}
                </form>
            </FormContext.Provider>
        </FormProvider>
    );
}
