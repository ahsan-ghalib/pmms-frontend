"use client";
import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import axiosInstance from "@/lib/axios";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const UniversalMultiSelect = ({
  label,
  name,
  value = [],
  onChange,
  data = [],
  apiEndpoint = null,
  dataToStore = null,
  valueKey = "id",
  labelKey = "name",
  searchParam = "search",
  placeholder = "Select items...",
  emptyMessage = "No items found.",
  isLoading = false,
  validation = {},
  errors,
  initialSelected = [],
}) => {
  const [open, setOpen] = React.useState(false);
  const [selectedValues, setSelectedValues] = React.useState(value || []);

  React.useEffect(() => {
    if (value && Array.isArray(value)) {
      setSelectedValues((prev) => {
        const currentValues = prev.map(String).sort().join(",");
        const newValues = value.map(String).sort().join(",");
        if (currentValues !== newValues) {
          return value;
        }
        return prev;
      });
    } else if (!value || (Array.isArray(value) && value.length === 0)) {
      setSelectedValues((prev) => {
        if (prev.length > 0) {
          return [];
        }
        return prev;
      });
    }
  }, [value]);

  const [fetchedData, setFetchedData] = React.useState([]);
  const [isFetching, setIsFetching] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [selectedItemsCache, setSelectedItemsCache] = React.useState(
    initialSelected || []
  );

  React.useEffect(() => {
    if (initialSelected && initialSelected.length > 0) {
      setSelectedItemsCache((prev) => {
        const validPrev = prev.filter(
          (item) =>
            item !== null && item !== undefined && item[valueKey] !== undefined
        );
        const existingIds = new Set(
          validPrev.map((item) => String(item[valueKey]))
        );
        const newItems = initialSelected.filter(
          (item) =>
            item &&
            item[valueKey] !== undefined &&
            !existingIds.has(String(item[valueKey]))
        );
        return [...validPrev, ...newItems];
      });
    }
  }, [initialSelected, valueKey]);

  React.useEffect(() => {
    if (!apiEndpoint || !selectedValues || selectedValues.length === 0) {
      return;
    }

    const fetchSelectedItems = async () => {
      const validCache = selectedItemsCache.filter(
        (item) =>
          item !== null && item !== undefined && item[valueKey] !== undefined
      );
      const cachedIds = new Set(
        validCache.map((item) => String(item[valueKey]))
      );
      const missingIds = selectedValues.filter(
        (id) => id !== null && id !== undefined && !cachedIds.has(String(id))
      );

      if (missingIds.length === 0) return;

      const fetchPromises = missingIds.map(async (id) => {
        try {
          const response = await axiosInstance.get(`${apiEndpoint}/${id}`);
          let item = null;
          if (dataToStore) {
            item =
              response.data[dataToStore] ||
              response.data?.data?.[dataToStore] ||
              response.data.data?.[dataToStore];
          } else {
            item = response.data?.data?.data || response.data?.data || response.data;
          }
          return item;
        } catch (error) {
          try {
            const listResponse = await axiosInstance.get(apiEndpoint, {
              params: {
                page: 1,
                pageSize: 100,
              },
            });
            let listData = [];
            if (dataToStore) {
              listData =
                listResponse.data[dataToStore] ||
                listResponse.data?.data?.[dataToStore] ||
                listResponse.data.data?.[dataToStore] ||
                [];
            } else {
              listData = listResponse.data?.data?.data || listResponse.data?.data || listResponse.data || [];
            }

            const validListData = (listData || []).filter(
              (item) =>
                item !== null &&
                item !== undefined &&
                item[valueKey] !== undefined
            );
            return (
              validListData.find(
                (item) => String(item[valueKey]) === String(id)
              ) || null
            );
          } catch (listError) {
            console.error(`Error fetching item ${id}:`, error);
            return null;
          }
        }
      });

      const fetchedItems = await Promise.all(fetchPromises);

      const validItems = fetchedItems.filter(
        (item) =>
          item !== null && item !== undefined && item[valueKey] !== undefined
      );

      if (validItems.length > 0) {
        setSelectedItemsCache((prev) => {
          const validPrev = prev.filter(
            (item) =>
              item !== null &&
              item !== undefined &&
              item[valueKey] !== undefined
          );
          const existingIds = new Set(
            validPrev.map((item) => String(item[valueKey]))
          );
          const newItems = validItems.filter(
            (item) =>
              item &&
              item[valueKey] !== undefined &&
              !existingIds.has(String(item[valueKey]))
          );
          return [...validPrev, ...newItems];
        });
      }
    };

    const timer = setTimeout(() => {
      fetchSelectedItems();
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedValues, apiEndpoint, valueKey, dataToStore]);

  React.useEffect(() => {
    if (!open) return;

    if (apiEndpoint) {
      const fetchData = async () => {
        setIsFetching(true);
        try {
          const response = await axiosInstance.get(apiEndpoint, {
            params: {
              [searchParam]: debouncedSearch || "",
              page: 1,
              pageSize: 50,
            },
          });

          let responseData = [];
          if (dataToStore) {
            responseData =
              response.data[dataToStore] ||
              response.data?.data?.[dataToStore] ||
              response.data.data?.[dataToStore] ||
              [];
          } else {
            const resData = response.data?.data?.data || response.data?.data || response.data || [];
            if (Array.isArray(resData)) {
              responseData = resData;
            } else if (typeof resData === "object" && resData !== null) {
              const firstArrayValue = Object.values(resData).find(val => Array.isArray(val));
              responseData = firstArrayValue || [];
            } else {
              responseData = [];
            }
          }

          if (Array.isArray(responseData)) {
            const validResponseData = responseData.filter(
              (item) =>
                item !== null &&
                item !== undefined &&
                item[valueKey] !== undefined
            );
            setFetchedData(validResponseData);

            const selectedInFetched = validResponseData.filter(
              (item) =>
                item &&
                item[valueKey] !== undefined &&
                selectedValues.includes(item[valueKey])
            );
            if (selectedInFetched.length > 0) {
              setSelectedItemsCache((prev) => {
                const validPrev = prev.filter(
                  (item) =>
                    item !== null &&
                    item !== undefined &&
                    item[valueKey] !== undefined
                );
                const existingIds = new Set(
                  validPrev.map((item) => String(item[valueKey]))
                );
                const newItems = selectedInFetched.filter(
                  (item) =>
                    item &&
                    item[valueKey] !== undefined &&
                    !existingIds.has(String(item[valueKey]))
                );
                return [...validPrev, ...newItems];
              });
            }
          } else {
            setFetchedData([]);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          setFetchedData([]);
        } finally {
          setIsFetching(false);
        }
      };
      fetchData();
    }
  }, [
    apiEndpoint,
    dataToStore,
    debouncedSearch,
    open,
    searchParam,
    selectedValues,
    valueKey,
  ]);

  const displayData = apiEndpoint ? fetchedData : data;
  const loading = isLoading || isFetching;

  const mergedDisplayData = React.useMemo(() => {
    if (!apiEndpoint) return data;

    const validFetchedData = fetchedData.filter(
      (item) =>
        item !== null && item !== undefined && item[valueKey] !== undefined
    );
    const fetchedIds = new Set(
      validFetchedData.map((item) => String(item[valueKey]))
    );

    const validCache = selectedItemsCache.filter(
      (item) =>
        item !== null && item !== undefined && item[valueKey] !== undefined
    );
    const selectedFromCache = validCache.filter(
      (item) =>
        item &&
        item[valueKey] !== undefined &&
        selectedValues.includes(item[valueKey])
    );

    const additionalSelected = selectedFromCache.filter(
      (item) =>
        item &&
        item[valueKey] !== undefined &&
        !fetchedIds.has(String(item[valueKey]))
    );

    return [...validFetchedData, ...additionalSelected];
  }, [
    apiEndpoint,
    fetchedData,
    selectedItemsCache,
    selectedValues,
    valueKey,
    data,
  ]);

  const handleSelect = (item) => {
    if (!item || item[valueKey] === undefined) return;

    const itemValue = item[valueKey];
    const newSelected = selectedValues.includes(itemValue)
      ? selectedValues.filter((v) => v !== itemValue)
      : [...selectedValues, itemValue];

    setSelectedValues(newSelected);

    // Add to cache if selecting (not deselecting)
    if (!selectedValues.includes(itemValue)) {
      setSelectedItemsCache((prev) => {
        // Filter out invalid items first
        const validPrev = prev.filter(
          (p) => p !== null && p !== undefined && p[valueKey] !== undefined
        );
        const exists = validPrev.find(
          (cached) => cached[valueKey] === itemValue
        );
        if (!exists) {
          return [...validPrev, item];
        }
        return validPrev;
      });
    }

    if (onChange) {
      onChange(newSelected);
    }
  };

  const handleRemove = (valueToRemove, e) => {
    e.stopPropagation();
    const newSelected = selectedValues.filter((v) => v !== valueToRemove);
    setSelectedValues(newSelected);
    if (onChange) {
      onChange(newSelected);
    }
  };

  // Get selected items for display (from merged data or cache)
  const selectedItems = React.useMemo(() => {
    const dataToSearch = apiEndpoint ? mergedDisplayData : displayData;
    // Filter out invalid items first
    const validDataToSearch = (dataToSearch || []).filter(
      (item) =>
        item !== null && item !== undefined && item[valueKey] !== undefined
    );
    const foundInData = validDataToSearch.filter(
      (item) =>
        item &&
        item[valueKey] !== undefined &&
        selectedValues.includes(item[valueKey])
    );

    if (apiEndpoint) {
      const foundIds = new Set(
        foundInData.map((item) => String(item[valueKey]))
      );

      const validCache = selectedItemsCache.filter(
        (item) =>
          item !== null && item !== undefined && item[valueKey] !== undefined
      );
      const missingFromData = validCache.filter(
        (item) =>
          item &&
          item[valueKey] !== undefined &&
          selectedValues.includes(item[valueKey]) &&
          !foundIds.has(String(item[valueKey]))
      );
      return [...foundInData, ...missingFromData];
    }

    return foundInData;
  }, [
    apiEndpoint,
    mergedDisplayData,
    displayData,
    selectedValues,
    selectedItemsCache,
    valueKey,
  ]);

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none">{label}</label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-[40px] h-auto">
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedItems.length > 0 ? (
                selectedItems
                  .filter(
                    (item) =>
                      item !== null &&
                      item !== undefined &&
                      item[valueKey] !== undefined
                  )
                  .map((item) => (
                    <Badge
                      key={item[valueKey]}
                      variant="secondary"
                      className="mr-1  ">
                      {item[labelKey] || ""}
                      <span
                        role="button"
                        tabIndex={0}
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRemove(item[valueKey], e);
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => handleRemove(item[valueKey], e)}>
                        <X className="h-3 w-3 text-white hover:text-foreground border-white border rounded-full" />
                      </span>
                    </Badge>
                  ))
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  emptyMessage
                )}
              </CommandEmpty>
              <CommandGroup>
                {mergedDisplayData
                  .filter(
                    (item) =>
                      item !== null &&
                      item !== undefined &&
                      item[valueKey] !== undefined
                  )
                  .map((item) => {
                    const isSelected = selectedValues.includes(item[valueKey]);
                    return (
                      <CommandItem
                        key={item[valueKey]}
                        onSelect={() => handleSelect(item)}
                        className="cursor-pointer">
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}>
                          <Check className="h-4 w-4" />
                        </div>
                        <span>{item[labelKey] || ""}</span>
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {errors && errors[name] && (
        <p className="text-sm text-destructive">{errors[name].message}</p>
      )}
    </div>
  );
};

export default UniversalMultiSelect;
