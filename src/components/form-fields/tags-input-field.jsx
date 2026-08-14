import React, { useState } from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Controller } from "react-hook-form";

export function TagsInputField({
  label,
  name,
  control,
  placeholder = "Type and press enter",
  errors = {},
  validation = {},
}) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e, value, onChange) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag) {
        const currentTags = value ? value.split(",").map(t => t.trim()).filter(Boolean) : [];
        if (!currentTags.includes(newTag)) {
          const nextTags = [...currentTags, newTag].join(",");
          onChange(nextTags);
        }
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue) {
      // Remove last tag on backspace if input is empty
      const currentTags = value ? value.split(",").map(t => t.trim()).filter(Boolean) : [];
      if (currentTags.length > 0) {
        const nextTags = currentTags.slice(0, -1).join(",");
        onChange(nextTags);
      }
    }
  };

  const removeTag = (indexToRemove, value, onChange) => {
    const currentTags = value ? value.split(",").map(t => t.trim()).filter(Boolean) : [];
    const nextTags = currentTags.filter((_, i) => i !== indexToRemove).join(",");
    onChange(nextTags);
  };

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
        render={({ field: { value, onChange, onBlur } }) => {
          const tags = typeof value === 'string' && value ? value.split(",").map(t => t.trim()).filter(Boolean) : [];
          return (
            <div 
              className={`flex flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${errors[name] ? 'border-destructive ring-destructive' : ''}`}
              onClick={() => document.getElementById(name)?.focus()}
            >
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 rounded-md bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(index, value, onChange);
                    }}
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-secondary-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                id={name}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, value, onChange)}
                onBlur={() => {
                  if (inputValue.trim()) {
                    const newTag = inputValue.trim();
                    const currentTags = value ? value.split(",").map(t => t.trim()).filter(Boolean) : [];
                    if (!currentTags.includes(newTag)) {
                      onChange([...currentTags, newTag].join(","));
                    }
                    setInputValue("");
                  }
                  onBlur();
                }}
                placeholder={tags.length === 0 ? placeholder : ""}
                className="flex-1 bg-transparent outline-none min-w-[120px] text-sm h-7"
              />
            </div>
          );
        }}
      />
      {errors[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
      )}
    </div>
  );
}
