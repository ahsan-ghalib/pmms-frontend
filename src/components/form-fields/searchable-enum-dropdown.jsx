"use client";
import React, { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/lib/axios";

export function SearchableEnumDropdown({
  name,
  label,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  fetchUrl,
  value,
  onChange,
  validation = {},
  errors = {},
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [enumOptions, setEnumOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fetchUrl) {
      setLoading(true);
      axiosInstance(fetchUrl)
        .then((response) => {
          const arr = response.data.data || [];
          setEnumOptions(
            arr.map((item) => ({
              value: item,
              label: item,
              searchText: item.toLowerCase(),
            }))
          );
        })
        .catch((error) => {
          console.error("Error fetching enum options:", error);
          setEnumOptions([]);
        })
        .finally(() => setLoading(false));
    }
  }, [fetchUrl]);

  const selectedOption = enumOptions.find((option) => option.value === value);

  return (
    <div className={cn("mb-4", className)}>
      {label && (
        <Label className="mb-2 block" htmlFor={name}>
          {label}
          {validation?.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground"
            )}
            disabled={disabled || loading}
          >
            {loading ? (
              "Loading..."
            ) : selectedOption ? (
              <span className="capitalize">{selectedOption.label}</span>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} className="h-9" />
            <CommandList className="max-h-[200px] overflow-y-auto">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {enumOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.searchText}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className="capitalize"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {errors[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
      )}
    </div>
  );
}

export default SearchableEnumDropdown;
