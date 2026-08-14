import React from 'react';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';

/**
 * CameraFileField - file input that opens camera on mobile devices
 * Usage: <CameraFileField ...props />
 *
 * Props:
 * - label: string
 * - name: string
 * - control: react-hook-form control
 * - errors: react-hook-form errors
 * - validation: validation rules
 * - accept: file types (default: 'image/*')
 * - capture: 'environment' (rear) | 'user' (front)
 * - multiple: boolean
 * - onChange: callback
 */
export function CameraFileField({
  label,
  name,
  control,
  errors,
  validation = {},
  accept = 'image/*',
  capture = 'environment',
  multiple = false,
  onChange,
  ...props
}) {
  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
      <Label className="mb-2" htmlFor={name}>
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
            capture={capture}
            multiple={multiple}
            onChange={e => {
              const files = e.target.files;
              fieldOnChange(files);
              if (onChange) onChange(e);
            }}
            {...field}
            {...props}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 border rounded-3xl p-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        )}
      />
      {errors[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
      )}
    </div>
  );
}
