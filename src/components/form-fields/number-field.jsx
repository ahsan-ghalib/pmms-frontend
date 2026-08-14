import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function NumberField({
    label,
    name,
    placeholder,
    register,
    errors = {},
    validation = {},
    min,
    max,
    step,
    useValueAsNumber = true,
    ...props
}) {
    const defaultValidation = {
        ...(min !== undefined && {
            min: {
                value: min,
                message: `Number must be at least ${min}`
            }
        }),
        ...(max !== undefined && {
            max: {
                value: max,
                message: `Number must be at most ${max}`
            }
        }),
        ...validation
    };

    return (
        <div className='mb-4'>
            <Label className="mb-2" htmlFor={name}>
                {label}
                {defaultValidation?.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
                type="number"
                id={name}
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
            {...register(name, { ...defaultValidation, valueAsNumber: useValueAsNumber })}
  {...props}
            />
            {errors[name] && (
                <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
            )}
        </div>
    );
}
