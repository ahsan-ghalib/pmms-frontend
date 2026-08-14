"use client";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function TableToolbar({
  placeholder = "Search...",
  total = 0,
  onSearchChange,
  className,
  rightSlot,
  config,
}) {
  const t = useTranslations("admin");
  const searchProps = config?.search || {
    placeholder,
    onChange: onSearchChange,
  };

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between gap-3",
        className
      )}
    >
      <div className="flex flex-1 items-center gap-2 max-w-2xl">
        <div className="relative flex-1 max-w-sm group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
          <Input
            placeholder={searchProps.placeholder && searchProps.placeholder !== "Search..." ? searchProps.placeholder : t("Search_placeholder", { defaultMessage: "Search..." })}
            value={searchProps.value || ""}
            onChange={(e) => searchProps.onChange?.(e.target.value)}
            className={cn(
              "pl-10 rounded-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 h-10",
              "focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary focus-visible:bg-white dark:focus-visible:bg-slate-900 transition-all shadow-sm"
            )}
          />
        </div>

        {/* Filters if present in config */}
        {config?.filters?.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto">
            <Button variant="outline" size="sm" className="rounded-full h-10 px-4 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            {config.filters.map((filter) => (
              <Select
                key={filter.key}
                value={filter.value || "all"}
                onValueChange={(val) => filter.onChange?.(val)}
              >
                <SelectTrigger className="w-[180px] rounded-full h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm">
                  <SelectValue placeholder={filter.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{filter.placeholder}</SelectItem>
                  {filter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {rightSlot}
      </div>
    </div>
  );
}
