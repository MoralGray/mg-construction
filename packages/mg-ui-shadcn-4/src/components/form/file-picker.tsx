import * as React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Input } from '../ui/input';
import { FormField } from './field';
import type { FieldProps } from './types';

export interface FilePickerFieldProps extends FieldProps {
    /** Accepted file types (e.g., "image/*,.pdf") */
    accept?: string;

    /** Whether to allow multiple file selection */
    multiple?: boolean;

    /** Callback when files are selected */
    onFileChange?: (files: FileList | null) => void;
}

export function FilePickerField({
    name,
    label,
    description,
    accept,
    multiple = false,
    required = false,
    disabled = false,
    className,
    onFileChange,
    ...props
}: FilePickerFieldProps) {
    const { control } = useFormContext();

    const handleFileChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            onFileChange?.(files);
            return files;
        },
        [onFileChange]
    );

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
                        type="file"
                        id={name}
                        accept={accept}
                        multiple={multiple}
                        disabled={disabled}
                        onChange={(e) => {
                            const files = handleFileChange(e);
                            field.onChange(files);
                        }}
                        aria-invalid={!!fieldState.error || undefined}
                        {...props}
                    />
                </FormField>
            )}
        />
    );
}
