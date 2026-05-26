import type * as React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Input } from '../ui/input';
import { FormField } from './field';
import type { FieldProps } from './types';

export function InputField({
    name,
    label,
    description,
    placeholder,
    required = false,
    disabled = false,
    type = 'text',
    className,
    ...props
}: FieldProps & React.ComponentProps<typeof Input>) {
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
                    <Input
                        {...field}
                        type={type}
                        placeholder={placeholder}
                        disabled={disabled}
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
