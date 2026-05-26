import type * as React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Textarea } from '../ui/textarea';
import { FormField } from './field';
import type { FieldProps } from './types';

export function TextareaField({
    name,
    label,
    description,
    placeholder,
    required = false,
    disabled = false,
    rows = 4,
    className,
    ...props
}: FieldProps & React.ComponentProps<typeof Textarea>) {
    const { control } = useFormContext();

    return (
        <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => (
                <FormField
                    name={name}
                    label={label}
                    description={description}
                    error={fieldState.error}
                    required={required}
                    disabled={disabled}
                    className={className}
                >
                    <Textarea
                        {...field}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={rows}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        aria-invalid={!!fieldState.error || undefined}
                        {...props}
                    />
                </FormField>
            )}
        />
    );
}
