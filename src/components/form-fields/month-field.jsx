import React from 'react';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

export function MonthField({
    label,
    name,
    register,
    errors,
    validation = {},
    ...props
}) {
    return (
        <div>
            <Label className="mb-2" htmlFor={name}>
                {label}
                {validation?.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
                type="month"
                id={name}
                {...register(name, validation)}
                {...props}
            />
            {errors[name] && (
                <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
            )}
        </div>
    );
}
