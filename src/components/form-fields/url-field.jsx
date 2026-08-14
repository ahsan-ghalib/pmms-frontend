import React from 'react';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

export function UrlField({
    label,
    name,
    placeholder,
    register,
    errors,
    validation = {},
    ...props
}) {
    const defaultValidation = {
        pattern: {
            value: /^https?:\/\/.+/,
            message: "Please enter a valid URL"
        },
        ...validation
    };

    return (
        <div>
            <Label className="mb-2" htmlFor={name}>
                {label}
                {defaultValidation?.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
                type="url"
                id={name}
                placeholder={placeholder}
                {...register(name, defaultValidation)}
                {...props}
            />
            {errors[name] && (
                <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
            )}
        </div>
    );
}
