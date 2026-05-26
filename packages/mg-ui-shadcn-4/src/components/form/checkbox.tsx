import type * as React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Checkbox } from '../ui/checkbox';
import { FormField } from './field';
import type { FieldProps } from './types';

export function CheckboxField({
    name,
    label,
    description,
    required = false,
    disabled = false,
    className,
    ...props
}: FieldProps & React.ComponentProps<typeof Checkbox>) {
    const { control } = useFormContext();

    return (
        <Controller
            name={name}
            control={control}
            defaultValue={false}
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
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={name}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={disabled}
                            aria-invalid={!!fieldState.error || undefined}
                            {...props}
                        />
                        {label && (
                            <label
                                htmlFor={name}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {label}
                            </label>
                        )}
                    </div>
                </FormField>
            )}
        />
    );
}
