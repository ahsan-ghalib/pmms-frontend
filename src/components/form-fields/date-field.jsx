import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DateField({
    label,
    name,
    register,
    errors,
    validation = {},
    ...props
}) {
    return (
        <div className='mb-4'>
            <Label className="mb-2" htmlFor={name}>
                {label}
                {validation?.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
                type="date"
                id={name}
                {...register(name, validation)}
                {...props}
            />
            {errors[name] && (
                <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>
            )}
        </div>
    );
}
