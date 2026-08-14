import React from "react";
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";

const textareaClass =
  "flex min-h-[80px] w-full rounded-md border border-input dark:border-white/10 bg-transparent dark:bg-slate-900/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * TextareaField supports two modes:
 * 1. Controlled mode  – pass `control` prop. setValue() from parent updates the visible value.
 * 2. Uncontrolled mode – pass `register` prop (legacy default).
 */
export function TextareaField({
  label,
  name,
  placeholder,
  register,
  control,
  errors = {},
  validation = {},
  rows = 4,
  onBlur,
  onChange,
  ...rest // dir, className, etc.
}) {
  const defaultPlaceholder =
    placeholder || `Enter ${label?.toLowerCase() || "text"}`;

  // ── Controlled mode (Controller) ──────────────────────────────────────────
  if (control) {
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
          render={({ field, fieldState }) => (
            <>
              <textarea
                id={name}
                rows={rows}
                placeholder={defaultPlaceholder}
                className={textareaClass}
                {...rest}
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  field.onChange(e);       // Keep RHF in sync
                  if (onChange) onChange(e); // Custom onChange callback
                }}
                onBlur={(e) => {
                  field.onBlur();
                  if (onBlur) onBlur(e);
                }}
              />
              {(errors[name] || fieldState.error) && (
                <p className="text-red-500 text-sm mt-1">
                  {errors[name]?.message || fieldState.error?.message}
                </p>
              )}
            </>
          )}
        />
      </div>
    );
  }

  // ── Uncontrolled mode (register) ──────────────────────────────────────────
  const registeredProps = register(name, validation);

  const handleBlur = (e) => {
    registeredProps.onBlur(e);
    if (onBlur) onBlur(e);
  };

  return (
    <div className="mb-4">
      <Label className="mb-2" htmlFor={name}>
        {label}
        {validation?.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <textarea
        id={name}
        rows={rows}
        placeholder={defaultPlaceholder}
        className={textareaClass}
        {...rest}
        {...registeredProps}
        onBlur={handleBlur}
      />
      {errors[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
      )}
    </div>
  );
}
