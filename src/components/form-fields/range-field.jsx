import React from 'react';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

export function RangeField({
    label,
    name,
    register,
    errors,
    validation = {},
    watch,
    min = 0,
    max = 100,
    step = 1,
    ...props
}) {
    const currentValue = watch ? watch(name) : null;

    return (
        <div>
            <Label className="mb-2" htmlFor={name}>
                {label}
                {validation?.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
                type="range"
                id={name}
                min={min}
                max={max}
                step={step}
                {...register(name, validation)}
                {...props}
            />
            {currentValue !== null && (
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Value: {currentValue}
                </div>
            )}
            {errors[name] && (
                <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
            )}
        </div>
    );
}
