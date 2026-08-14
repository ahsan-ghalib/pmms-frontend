import React from "react";
import { Label } from "@/components/ui/label";

export function RadioField({
  label,
  name,
  options = [],
  register,
  errors,
  validation = {},
  direction = "vertical", // "vertical" or "horizontal"
  ...props
}) {
  const containerClass =
    direction === "horizontal"
      ? "flex flex-row space-x-4"
      : "flex flex-col space-y-2";

  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
      <Label className="mb-2">
        {label}
        {validation?.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className={containerClass}>
        {options.map((option, index) => (
          <div key={option.value} className="flex items-center space-x-2">
            <input
              type="radio"
              id={`${name}-${index}`}
              value={option.value}
              {...register(name, validation)}
              {...props}
              className="accent-black w-4 h-4" // 👈 important line
            />
            <Label htmlFor={`${name}-${index}`}>{option.label}</Label>
          </div>
        ))}
      </div>
      {errors[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
      )}
    </div>
  );
}
