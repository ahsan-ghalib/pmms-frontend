import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { Controller } from 'react-hook-form';

export function DatePickerField({
    label = "Date Picker",
    name,
    control,
    errors,
    validation = {},
    placeholder = "Select date",
    ...props
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className='mb-4'>
            <Label className="mb-2" htmlFor={name}>
                {label}
                {validation?.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Controller
                name={name}
                control={control}
                rules={validation}
                render={({ field }) => (
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                id={name}
                                className="w-full justify-between font-normal"
                            >
                                {field.value ? field.value.toLocaleDateString() : placeholder}
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                captionLayout="dropdown"
                                onSelect={(date) => {
                                    field.onChange(date);
                                    setOpen(false);
                                }}
                                {...props}
                            />
                        </PopoverContent>
                    </Popover>
                )}
            />
            {errors[name] && (
                <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
            )}
        </div>
    );
}
