import { Controller, useFormContext } from 'react-hook-form';

import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { FormField } from './field';
import type { FieldProps } from './types';

export interface RadioFieldProps extends FieldProps {
    /** Options for the radio group */
    options?: Array<{
        value: string;
        label: string;
        description?: string;
    }>;

    /** Layout direction */
    orientation?: 'horizontal' | 'vertical';
}

export function RadioField({
    name,
    label,
    description,
    options = [],
    orientation = 'vertical',
    required = false,
    disabled = false,
    className,
    ...props
}: RadioFieldProps) {
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
                    <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={disabled}
                        orientation={orientation}
                        aria-invalid={!!fieldState.error || undefined}
                        {...props}
                    >
                        {options.length > 0 ? (
                            options.map((option) => (
                                <label
                                    key={option.value}
                                    htmlFor={`${name}-${option.value}`}
                                    className="flex cursor-pointer items-center space-x-2"
                                >
                                    <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
                                    <span className="text-xs font-normal leading-none">
                                        {option.label}
                                        {option.description && (
                                            <span className="mt-0.5 block text-sm text-muted-foreground">
                                                {option.description}
                                            </span>
                                        )}
                                    </span>
                                </label>
                            ))
                        ) : (
                            <div className="text-sm text-muted-foreground">No options available</div>
                        )}
                    </RadioGroup>
                </FormField>
            )}
        />
    );
}
