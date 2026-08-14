import React from "react";
import { Label } from '@/components/ui/label';

const MultiFileField = ({ label, name, onFilesChange, accept, helperText, error, validation = {} }) => {
  return (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6">
      {label && (
        <Label className="mb-2" htmlFor={name}>
          {label}
          {validation?.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <input
        type="file"
        id={name}
        name={name}
        multiple
        accept={accept}
        onChange={e => onFilesChange(e.target.files)}
        className="block  w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4  border rounded-3xl p-1  file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {helperText && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helperText}</div>}
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
};

export default MultiFileField;
