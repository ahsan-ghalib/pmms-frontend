import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react'; // Import Search icon

export function SearchField({
                                label,
                                name,
                                placeholder,
                                register,
                                errors,
                                validation = {},
                                ...props
                            }) {
    return (
        <div className="relative w-full max-w-sm">
            {label && (
                <Label className="mb-2" htmlFor={name}>
                    {label}
                    {validation?.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
            )}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    id={name}
                    placeholder={placeholder}
                    className="pl-10" // Add padding for the search icon
                    {...register(name, validation)}
                    {...props}
                />
            </div>
            {errors[name] && (
                <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
            )}
        </div>
    );
}
