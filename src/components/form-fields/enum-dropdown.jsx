import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller } from "react-hook-form";
import axiosInstance from "@/lib/axios";

export function EnumDropdown({
  name,
  label,
  placeholder = "Select...",
  control,
  fetchUrl,
  validation = {},
  errors = {},
}) {
  const [enumOptions, setEnumOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fetchUrl) {
      setLoading(true);
      axiosInstance(fetchUrl)
        .then((response) => {
          const arr = response.data.data || [];
          setEnumOptions(arr.map((item) => ({ value: item, label: item })));
        })
        .catch((error) => {
          setEnumOptions([]);
        })
        .finally(() => setLoading(false));
    }
  }, [fetchUrl]);

  return (
    <div className="mb-4">
      {label && (
        <Label className="mb-2 capitalize" htmlFor={name}>
          {label}
          {validation?.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Controller
        name={name}
        control={control}
        rules={validation}
        render={({ field }) => (
          <Select
            onValueChange={field.onChange}
            value={field.value}
            disabled={loading}
          >
             
            <SelectTrigger id={name} className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {enumOptions.length === 0 && !loading && (
                <div className="px-2 py-1 text-muted-foreground text-sm">
                  No options
                </div>
              )}
              {enumOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="capitalize"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errors[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
      )}
    </div>
  );
}
