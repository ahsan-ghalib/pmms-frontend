"use client";

import React, { useState, useEffect, useRef } from "react";

function getNestedValue(obj, key) {
  if (!obj || !key) return "";
  return key.split(".").reduce((acc, k) => acc && acc[k], obj);
}
import { Controller } from "react-hook-form";
import axiosInstance from "@/lib/axios";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function UniversalComboBoxField({
  label = "",
  name = "",
  control,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  errors,
  validation = {},
  className = "",
  disabled = false,
  selectedItem,
  setSelectedItem,
  dataToStore,
  apiEndpoint,
  valueKey = "id",
  labelKey = "name",
  searchParam = "search",
  params,
  multipleValues = false,
  additionalValueKeys = [],
  onValueChange,
  variant = "default",
  ...props
}) {
  const comboBoxParams = params ? { ...params } : {};

  return (
    <div className={"w-full " + className}>
      {label && (
        <label
          htmlFor={name}
          className={`block mb-1 font-medium text-sm ${variant === "auth" ? "text-[var(--t-text)]" : "text-black"}`}
        >
          {label}
          {validation?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Controller
        name={name}
        control={control}
        rules={validation}
        render={({ field }) => {
          // Ensure value is always a primitive, not an object
          const normalizedValue = typeof field.value === "object" && field.value !== null
            ? (field.value[valueKey] != null ? field.value[valueKey] : "")
            : field.value;
          
          const handleChange = (newValue) => {
            // Ensure we always pass a primitive value, not an object
            const valueToSet = typeof newValue === "object" && newValue !== null
              ? (newValue[valueKey] != null ? newValue[valueKey] : newValue)
              : newValue;
            field.onChange(valueToSet);
            // Call onValueChange callback if provided
            if (onValueChange) {
              onValueChange(valueToSet);
            }
          };
          
          return (
            <UniversalComboBoxInput
              value={normalizedValue}
              onChange={handleChange}
              placeholder={placeholder}
            searchPlaceholder={searchPlaceholder}
            emptyMessage={emptyMessage}
            disabled={disabled}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            dataToStore={dataToStore}
            apiEndpoint={apiEndpoint}
            valueKey={valueKey}
            labelKey={labelKey}
            searchParam={searchParam}
            params={comboBoxParams}
            multipleValues={multipleValues}
            additionalValueKeys={additionalValueKeys}
            onValueChange={onValueChange}
            {...props}
          />
          );
        }}
      />
      {errors && errors[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
      )}
    </div>
  );
}

export function UniversalComboBoxInput({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled,
  selectedItem,
  setSelectedItem,
  apiEndpoint,
  valueKey,
  dataToStore,
  labelKey,
  searchParam = "search",
  params,
  multipleValues,
  additionalValueKeys,
  onValueChange,
  variant = "default",
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    axiosInstance(apiEndpoint, {
      params: {
        ...(params || {}),
        [searchParam]: debouncedSearch || "",
        page: 1,
        pageSize: 10,
      },
    })
      .then((response) => {
        let data = [];
        if (dataToStore) {
          data =
            response.data[dataToStore] ||
            response.data?.[dataToStore] ||
            response.data.data?.[dataToStore] ||
            response.data.data?.[dataToStore] ||
            [];
        } else {
          const resData = response.data.data || response.data || [];
          if (Array.isArray(resData)) {
            data = resData;
          } else if (typeof resData === "object" && resData !== null) {
            // Find the first array value in the object (e.g., res.data.data.products)
            const firstArrayValue = Object.values(resData).find(val => Array.isArray(val));
            data = firstArrayValue || [];
          } else {
            data = [];
          }
        }
        if (Array.isArray(data)) {
          const mappedOptions = data.map((item) => {
            const labelValue = getNestedValue(item, labelKey);
            // Ensure label is always a string, not an object
            const label = typeof labelValue === "string" 
              ? labelValue 
              : typeof labelValue === "object" && labelValue !== null 
                ? String(labelValue) 
                : "";
            return {
              value: item[valueKey] ?? "",
              label,
              rawData: item,
            };
          });
          setOptions(mappedOptions);
        } else {
          setOptions([]);
        }
      })
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [
    debouncedSearch,
    open,
    apiEndpoint,
    valueKey,
    labelKey,
    searchParam,
    params,
    dataToStore,
  ]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [options, open]);

  useEffect(() => {
    if (!open && value && !options.find((opt) => opt.value === value)) {
      axiosInstance(`${apiEndpoint}/${value}`)
        .then((response) => {
          let item = null;
          if (dataToStore) {
            item =
              response.data[dataToStore] ||
              response.data.data?.[dataToStore] ||
              response.data.data?.[dataToStore];
          } else {
            item = response.data.data || response.data;
          }
          if (item && item[valueKey]) {
            const labelValue = getNestedValue(item, labelKey);
            // Ensure label is always a string, not an object
            const label = typeof labelValue === "string" 
              ? labelValue 
              : typeof labelValue === "object" && labelValue !== null 
                ? String(labelValue) 
                : "";
            setOptions((prev) => [
              { value: item[valueKey], label },
              ...prev,
            ]);
          }
        })
        .catch(() => {});
    }
  }, [value, open, options, apiEndpoint, valueKey, labelKey, dataToStore]);

  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  useEffect(() => {
    if (!open) setHighlightedIdx(-1);
    else setHighlightedIdx(0);
  }, [open, options]);

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      setHighlightedIdx((idx) => Math.min(idx + 1, options.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlightedIdx((idx) => Math.max(idx - 1, 0));
      e.preventDefault();
    } else if (
      e.key === "Enter" &&
      highlightedIdx >= 0 &&
      options[highlightedIdx]
    ) {
      selectOption(options[highlightedIdx]);
      e.preventDefault();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function selectOption(option) {
    if (!option) return;

    if (multipleValues && additionalValueKeys.length > 0) {
      const multipleData = {
        [valueKey]: option.value,
        [labelKey]: option.label,
      };
      additionalValueKeys.forEach((key) => {
        multipleData[key] = option.rawData[key];
      });
      onChange(multipleData);
      if (setSelectedItem) setSelectedItem(multipleData, option.rawData);
    } else {
      onChange(option.value);
      if (setSelectedItem) {
        // Pass both the simple object and rawData
        setSelectedItem({ [valueKey]: option.value, [labelKey]: option.label }, option.rawData);
      }
    }

    setOpen(false);
    setSearch("");
  }

  // Ensure value is always a primitive (ID), not an object
  const getPrimitiveValue = (val) => {
    if (val == null) return "";
    if (multipleValues && typeof val === "object") {
      return val[valueKey] != null ? String(val[valueKey]) : "";
    }
    if (typeof val === "object") {
      return val[valueKey] != null ? String(val[valueKey]) : "";
    }
    return String(val);
  };
  
  const currentValue = getPrimitiveValue(value);
  const valueToCompare = currentValue;

  let selectedOption = options.find(
    (opt) => String(opt.value) === valueToCompare
  );

  if (!selectedOption && selectedItem && selectedItem[valueKey]) {
    const id = selectedItem[valueKey];
    const name = getNestedValue(selectedItem, labelKey);
    // Ensure label is always a string, not an object
    let label = "";
    if (typeof name === "string") {
      label = name;
    } else if (typeof name === "number" || typeof name === "boolean") {
      label = String(name);
    } else if (name != null) {
      // If it's an object, try to get a meaningful string representation
      label = name[labelKey] || name.name || name.status || String(name);
    }
    label = String(label || "");
    selectedOption = { value: id, label };
    if (!options.find((opt) => String(opt.value) === String(id))) {
      setOptions((prev) => [{ value: id, label }, ...prev]);
    }
  }

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (open && listRef.current && highlightedIdx >= 0) {
      const el = listRef.current.children[highlightedIdx];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIdx, open]);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        className={
          variant === "auth"
            ? `w-full text-left rounded-xl px-4 py-3 transition-colors outline-none border flex items-center justify-between ${
                disabled
                  ? "opacity-50 cursor-not-allowed bg-white/5 border-[var(--t-border)] text-[var(--t-text-muted)]"
                  : "bg-white/5 border-[var(--t-border)] text-[var(--t-text)] hover:bg-[var(--t-glass-hover)] focus:border-[var(--t-accent)] focus:ring-2 focus:ring-[var(--t-accent-soft)]"
              }`
            : variant === "dark"
            ? `w-full text-left rounded-xl px-4 py-3 transition-colors outline-none border flex items-center justify-between ${
                disabled
                  ? "opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-white/50"
                  : "bg-white/5 border-white/10 text-white hover:bg-white/10 focus:border-white/30 focus:ring-1 focus:ring-white/30"
              }`
            : `w-full border-input h-10 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px] flex items-center justify-between text-left ${
                disabled
                  ? "pointer-events-none cursor-not-allowed opacity-50 bg-muted/50"
                  : "bg-background hover:bg-accent hover:text-accent-foreground"
              }`
        }
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className={selectedOption ? "" : (variant === "auth" ? "text-[var(--t-text-muted)]" : "text-muted-foreground")}>
          {selectedOption 
            ? (typeof selectedOption.label === "string" 
                ? selectedOption.label 
                : String(selectedOption.label || ""))
            : placeholder}
        </span>
        <svg
          className={`w-4 h-4 ml-2 ${variant === "auth" ? "text-[var(--t-text-muted)]" : "text-gray-400"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className={`absolute z-20 mt-1 w-full border rounded shadow-lg max-h-60 overflow-x-hidden overflow-y-auto backdrop-blur-xl ${
          variant === "auth" ? "bg-[var(--t-bg-card)] border-[var(--t-border-strong)] text-[var(--t-text)]" :
          variant === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200"
        }`}>
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              className={`w-full border rounded px-2 py-2 focus:outline-none focus:ring-2 text-sm ${
                variant === "auth" ? "bg-transparent border-[var(--t-border)] text-[var(--t-text)] placeholder:text-[var(--t-text-muted)] focus:ring-[var(--t-accent-soft)] focus:border-[var(--t-accent)]" :
                variant === "dark" ? "bg-gray-800 border-gray-700 text-white focus:ring-blue-500/50" : "bg-white border-gray-300 focus:ring-blue-500"
              }`}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>
          <ul
            ref={listRef}
            tabIndex={-1}
            role="listbox"
            className="max-h-40 overflow-auto text-sm custom-scrollbar"
          >
            {loading ? (
              <li className={`py-2 px-3 ${variant === "auth" ? "text-[var(--t-text-muted)]" : variant === "dark" ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>Loading...</li>
            ) : options.length === 0 ? (
              <li className={`py-2 px-3 ${variant === "auth" ? "text-[var(--t-text-muted)]" : variant === "dark" ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}`}>{emptyMessage}</li>
            ) : (
              options.map((option, idx) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={value === option.value}
                  className={`cursor-pointer px-3 py-2.5 flex items-center justify-between transition-colors ${
                    variant === "auth"
                      ? (idx === highlightedIdx ? "bg-[var(--t-glass-hover)] text-[var(--t-text)]" : "hover:bg-[var(--t-glass-hover)] text-[var(--t-text)]")
                      : variant === "dark" 
                      ? (idx === highlightedIdx ? "bg-gray-800 text-white" : "hover:bg-gray-800 text-gray-200")
                      : (idx === highlightedIdx ? "bg-blue-100 text-gray-900" : "hover:bg-blue-100 text-gray-700")
                  } ${
                    (multipleValues ? value && value[valueKey] : value) === option.value
                      ? (variant === "auth" ? "font-semibold text-[var(--t-accent)] bg-[var(--t-glass-bg)]" : variant === "dark" ? "font-semibold text-blue-400" : "font-semibold text-blue-700")
                      : ""
                  }`}
                  onMouseDown={() => selectOption(option)}
                  onMouseEnter={() => setHighlightedIdx(idx)}
                >
                  <span>{typeof option.label === "string" ? option.label : String(option.label || "")}</span>
                  {(multipleValues ? value && value[valueKey] : value) === option.value && (
                    <svg
                      className={`w-4 h-4 ml-2 ${variant === "auth" ? "text-[var(--t-accent)]" : "text-blue-500"}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
