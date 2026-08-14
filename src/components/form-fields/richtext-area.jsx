"use client";
import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";

const QuillEditor = dynamic(() => import("./quill-editor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[240px] bg-gray-50 border border-gray-300 rounded-md flex items-center justify-center animate-pulse">
      Loading editor...
    </div>
  ),
});

const RichTextArea = ({
  label,
  name,
  control,
  errors,
  validation = {},
  placeholder = "Write your content...",
  heightClass = "min-h-[240px]",
}) => {
  return (
    <div className="space-y-2">
      {label && <Label htmlFor={name}>{label}</Label>}

      <Controller
        name={name}
        control={control}
        rules={validation}
        render={({ field: { value, onChange } }) => (
          <QuillEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            heightClass={heightClass}
          />
        )}
      />

      {errors?.[name] && (
        <p className="text-sm text-destructive mt-1">{errors[name].message}</p>
      )}
    </div>
  );
};

export default RichTextArea;
