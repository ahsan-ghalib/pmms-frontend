import React from 'react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Controller } from 'react-hook-form';

export function SelectField({
    label,
    name,
    options = [],
    control,
    errors = {},
    validation = {},
    placeholder = "Select an option",
    onValueChange,
    ...props
}) {
    return (
        <div className="mb-4">
            <Label className="mb-2" htmlFor={name}>
                {label}
                {validation?.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Controller
                name={name}
                control={control}
                rules={validation}
                render={({ field }) => (
                    <Select 
                        onValueChange={(value) => {
                            field.onChange(value);
                            if (onValueChange) {
                                onValueChange(value);
                            }
                        }} 
                        value={field.value} 
                        {...props} 
                        className="w-100">
                        <SelectTrigger id={name} className="w-full">
                            <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
            {errors[name] && (
                <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
            )}
        </div>
    );
}
