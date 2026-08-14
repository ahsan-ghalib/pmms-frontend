import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";

/**
 * TextField supports two modes:
 * 1. Controlled mode  – pass `control` prop (uses Controller from RHF).
 *    setValue() from the parent WILL update the visible input.
 * 2. Uncontrolled mode – pass `register` prop (uses register from RHF).
 *    Good for regular fields that don't need external setValue updates.
 */
export function TextField({
  label,
  name,
  placeholder,
  register,
  control,
  errors,
  error,
  validation = {},
  onBlur,
  onChange,
  ...rest // everything else (dir, className, disabled, required, etc.)
}) {
  const isRequired = validation?.required || rest?.required;

  // Resolve the displayed error from either `error` prop or `errors[name]` map
  const resolvedError = error || (errors && errors[name]);
  const errorMessage =
    typeof resolvedError === "string" ? resolvedError : resolvedError?.message;

  // ── Controlled mode (Controller) ──────────────────────────────────────────
  if (control) {
    return (
      <div className="mb-4">
        <Label className="mb-2" htmlFor={name}>
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Controller
          name={name}
          control={control}
          rules={validation}
          render={({ field, fieldState }) => (
            <>
              <Input
                type="text"
                id={name}
                placeholder={placeholder}
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
              {(errorMessage || fieldState.error?.message) && (
                <p className="text-red-500 text-sm mt-1">
                  {errorMessage || fieldState.error?.message}
                </p>
              )}
            </>
          )}
        />
      </div>
    );
  }

  // ── Uncontrolled mode (register) ──────────────────────────────────────────
  const registeredProps = register ? register(name, validation) : {};

  const handleBlur = (e) => {
    if (registeredProps.onBlur) registeredProps.onBlur(e);
    if (onBlur) onBlur(e);
  };

  const handleChange = (e) => {
    if (registeredProps.onChange) registeredProps.onChange(e);
    if (onChange) onChange(e);
  };

  return (
    <div className="mb-4">
      <Label className="mb-2" htmlFor={name}>
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        type="text"
        id={name}
        placeholder={placeholder}
        {...rest}
        {...registeredProps}
        onBlur={handleBlur}
        onChange={handleChange}
      />
      {errorMessage && (
        <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
}
