import type * as React from 'react';
import type { FieldError, FieldValues, UseFormReturn } from 'react-hook-form';
import type { ZodSchema } from 'zod';

// Base field props interface
export interface FieldProps {
    /** The name/path of the field in the form data */
    name: string;

    /** Label text for the field */
    label?: string;

    /** Help text or description */
    description?: string;

    /** Placeholder text */
    placeholder?: string;

    /** Whether the field is required */
    required?: boolean;

    /** Whether the field is disabled */
    disabled?: boolean;

    /** Additional CSS classes */
    className?: string;

    /** Field-specific properties */
    [key: string]: unknown;
}

// Form component props
export interface FormProps<T extends FieldValues> {
    /** Submit handler function */
    onSubmit: (data: T) => void | Promise<void>;

    /** Default values for the form */
    defaultValues?: Partial<T>;

    /** Zod schema for validation */
    schema?: ZodSchema<T>;

    /** Form content (fields and buttons) */
    children: React.ReactNode;

    /** Additional CSS classes */
    className?: string;

    /** Callback when form is successfully submitted */
    onSuccess?: () => void;

    /** Callback when form submission fails */
    onError?: (errors: Record<string, FieldError>) => void;
}

// Context type for form state
export type FormContextType<T extends FieldValues> = UseFormReturn<T>;

// Error message component props
export interface ErrorMessageProps {
    /** Error object from react-hook-form */
    error?: FieldError;

    /** Custom error message */
    message?: string;

    /** Additional CSS classes */
    className?: string;
}

// Field wrapper component props
export interface FieldWrapperProps {
    /** Field name for label association */
    name: string;

    /** Label text */
    label?: string;

    /** Help text */
    description?: string;

    /** Error message */
    error?: FieldError;

    /** Whether field is required */
    required?: boolean;

    /** Whether field is disabled */
    disabled?: boolean;

    /** Field content */
    children: React.ReactNode;

    /** Additional CSS classes */
    className?: string;
}
