import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Controller } from "react-hook-form";

export function SwitchField({
  label,
  description,
  name,
  control,
  errors,
  validation = {},
  checked,
  onCheckedChange,
}) {
  if (control) {
    return (
      <div className="flex justify-between items-center p-4 border mb-4 rounded-lg">
        <div>
          <Label htmlFor={name} className="text-sm font-medium">
            {label || "Label"}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <Controller
          name={name}
          control={control}
          rules={validation}
          render={({ field }) => (
            <Switch
              id={name}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center p-4 border mb-4 rounded-lg">
      <div>
        <Label htmlFor={name} className="text-sm font-medium">
          {label || "Label"}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch id={name} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
