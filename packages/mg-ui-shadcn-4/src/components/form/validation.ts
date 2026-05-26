import { z } from 'zod';

// Common validation schemas
export const validators = {
    // String validators
    required: (message = 'This field is required') => z.string().min(1, { message }),

    email: (message = 'Please enter a valid email address') => z.string().email({ message }),

    minLength: (length: number, message?: string) =>
        z.string().min(length, { message: message || `Must be at least ${length} characters` }),

    maxLength: (length: number, message?: string) =>
        z.string().max(length, { message: message || `Cannot exceed ${length} characters` }),

    pattern: (regex: RegExp, message?: string) => z.string().regex(regex, { message: message || 'Invalid format' }),

    url: (message = 'Please enter a valid URL') => z.string().url({ message }),

    // Number validators
    min: (value: number, message?: string) =>
        z.number().min(value, { message: message || `Must be at least ${value}` }),

    max: (value: number, message?: string) => z.number().max(value, { message: message || `Cannot exceed ${value}` }),

    positive: (message = 'Must be a positive number') => z.number().positive({ message }),

    // Date validators
    minDate: (date: Date, message?: string) =>
        z.date().min(date, { message: message || `Date must be after ${date.toLocaleDateString()}` }),

    maxDate: (date: Date, message?: string) =>
        z.date().max(date, { message: message || `Date must be before ${date.toLocaleDateString()}` }),

    // Array validators
    minItems: (count: number, message?: string) =>
        z.array(z.any()).min(count, { message: message || `Select at least ${count} item(s)` }),

    maxItems: (count: number, message?: string) =>
        z.array(z.any()).max(count, { message: message || `Select at most ${count} item(s)` }),
};

// Pre-configured validators for common use cases
export const commonValidators = {
    name: validators.minLength(2, 'Name must be at least 2 characters'),
    email: validators.email(),
    password: validators.minLength(8, 'Password must be at least 8 characters'),
    phone: validators.pattern(/^[+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
    url: validators.url(),
    requiredString: validators.required(),
};

// Helper function to create a form schema
export function createFormSchema<T extends z.ZodRawShape>(shape: T) {
    return z.object(shape);
}

// Helper to combine multiple validators
export function combineValidators<T extends z.ZodTypeAny>(...validators: T[]): T {
    return validators.reduce((acc, validator) => acc.and(validator) as T);
}
