import { Controller, useFormContext } from 'react-hook-form';

import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    useComboboxAnchor,
} from '../ui/combobox';
import { FormField } from './field';
import type { FieldProps } from './types';

export interface ComboboxFieldProps extends FieldProps {
    options?: Array<{
        value: string;
        label: string;
    }>;
    placeholder?: string;
}

export function ComboboxField({
    name,
    label,
    description,
    options = [],
    placeholder,
    required = false,
    disabled = false,
    className,
    ...props
}: ComboboxFieldProps) {
    const { control } = useFormContext();
    const anchorRef = useComboboxAnchor();

    return (
        <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => {
                const values: string[] = Array.isArray(field.value) ? field.value : [];
                const labelMap = new Map(options.map((o) => [o.value, o.label]));

                return (
                    <FormField
                        name={name}
                        label={label}
                        description={description}
                        error={fieldState.error}
                        required={required}
                        disabled={disabled}
                        className={className}
                    >
                        <Combobox
                            multiple
                            value={values}
                            onValueChange={(next) => field.onChange(next)}
                            disabled={disabled}
                            items={options}
                            itemToStringLabel={(v) => labelMap.get(v) || v}
                            {...props}
                        >
                            <ComboboxChips ref={anchorRef}>
                                {values.map((v) => (
                                    <ComboboxChip key={v}>{labelMap.get(v) || v}</ComboboxChip>
                                ))}
                                <ComboboxChipsInput
                                    placeholder={placeholder || `Search ${label?.toLowerCase() || 'options'}...`}
                                    aria-invalid={!!fieldState.error || undefined}
                                />
                            </ComboboxChips>
                            <ComboboxContent anchor={anchorRef}>
                                <ComboboxInput placeholder={`Search ${label?.toLowerCase() || 'options'}...`} />
                                <ComboboxList>
                                    {(item: { value: string; label: string }) => (
                                        <ComboboxItem key={item.value} value={item.value}>
                                            {item.label}
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                                <ComboboxEmpty>No results found</ComboboxEmpty>
                            </ComboboxContent>
                        </Combobox>
                    </FormField>
                );
            }}
        />
    );
}
