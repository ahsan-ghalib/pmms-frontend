import React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FileField({
    label,
    name,
    control,
    errors,
    validation = {},
    accept,
    multiple = false,
    onChange,
    helperText,
    ...props
}) {
    return (
        <div className='mb-4'>
            <Label className="mb-2 " htmlFor={name}>
                {label}
                {validation?.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Controller
                name={name}
                control={control}
                rules={validation}
              
                render={({ field: { onChange: fieldOnChange, value, ...field } }) => (
                    <input
                        type="file"
                       
                        id={name}
                        accept={accept}
                        multiple={multiple}
                        onChange={(e) => {
                            const files = e.target.files;
                            fieldOnChange(files);
                            if (onChange) {
                                onChange(e);
                            }
                        }}
                        {...field}
                        {...props}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 border rounded-3xl p-1  file:mr-4  file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                )}
            />
            {helperText && (
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{helperText}</p>
            )}
            {errors[name] && (
                <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
            )}
        </div>
    );
}

 
