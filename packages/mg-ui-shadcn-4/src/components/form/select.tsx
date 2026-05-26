import { Controller, useFormContext } from 'react-hook-form';

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FormField } from './field';
import type { FieldProps } from './types';

export interface SelectFieldProps extends FieldProps {
    /** Options for the select dropdown */
    options?: Array<{
        value: string;
        label: string;
        description?: string;
    }>;

    /** Placeholder text when no value is selected */
    placeholder?: string;
}

export function SelectField({
    name,
    label,
    description,
    options = [],
    placeholder,
    required = false,
    disabled = false,
    className,
    ...props
}: SelectFieldProps) {
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
                    <Select value={field.value} onValueChange={field.onChange} disabled={disabled} {...props}>
                        <SelectTrigger aria-invalid={!!fieldState.error || undefined}>
                            <SelectValue placeholder={placeholder || `Select ${label?.toLowerCase() || 'an option'}`} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {options.length > 0 ? (
                                    options.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="__no_options__" disabled>
                                        No options available
                                    </SelectItem>
                                )}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </FormField>
            )}
        />
    );
}
