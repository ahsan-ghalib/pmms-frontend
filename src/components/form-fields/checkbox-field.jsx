import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function CheckboxField({ label, checked, onChecked, error, ...props }) {
  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={label}
          checked={checked}
          onCheckedChange={onChecked}
          {...props}
        />

        <Label htmlFor={label}>{label}</Label>
      </div>
    </div>
  );
}
