"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";

export default function CompanyCategoryPicker({ value, onChange }) {
  const t = useT("common");
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    Promise.all([
      complaintsApi.categories({ scope: "master" }),
      complaintsApi.services({ scope: "master" }),
    ]).then(([cats, svcs]) => {
      setCategories((Array.isArray(cats) ? cats : []).filter((item) => item.status === "active"));
      setServices((Array.isArray(svcs) ? svcs : []).filter((item) => item.status === "active"));
    }).catch(() => {});
  }, []);

  const servicesByCategory = useMemo(() => services.reduce((map, service) => {
    (map[service.category_id] ||= []).push(service);
    return map;
  }, {}), [services]);

  const toggleCategory = (category) => {
    const next = { ...value };
    if (next[category.id]) {
      delete next[category.id];
    } else {
      next[category.id] = (servicesByCategory[category.id] || []).map((service) => service.id);
    }
    onChange(next);
  };

  const toggleService = (categoryId, serviceId) => {
    const current = value[categoryId] || [];
    onChange({
      ...value,
      [categoryId]: current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    });
  };

  const selectAll = () => onChange(Object.fromEntries(categories.map((category) => [
    category.id,
    (servicesByCategory[category.id] || []).map((service) => service.id),
  ])));

  const selectedCount = Object.keys(value).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
          {t("categories_selected_count", { defaultMessage: "{count} / {total} selected", count: selectedCount, total: categories.length })}
        </span>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={selectAll} disabled={!categories.length}>
            {t("select_all", { defaultMessage: "Select all" })}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => onChange({})} disabled={!selectedCount}>
            {t("clear", { defaultMessage: "Clear" })}
          </Button>
        </div>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-slate-400">{t("no_master_categories", { defaultMessage: "No master categories yet" })}</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {categories.map((category) => {
            const selected = Boolean(value[category.id]);
            const categoryServices = servicesByCategory[category.id] || [];
            return (
              <div
                key={category.id}
                className={cn(
                  "rounded-2xl border p-4 transition",
                  selected
                    ? "border-violet-400 bg-violet-50/80 dark:border-violet-500/50 dark:bg-violet-500/10"
                    : "border-slate-200/80 bg-white/50 dark:border-white/10 dark:bg-white/5"
                )}
              >
                <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={() => toggleCategory(category)}>
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 shrink-0 rounded-lg" style={{ backgroundColor: category.color || "#0EA5E9" }} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{category.name_en}</p>
                      <p className="text-xs text-slate-500">{category.code} · {categoryServices.length} {t("services", { defaultMessage: "services" })}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white dark:border-white/20 dark:bg-transparent"
                  )}>
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </span>
                </button>

                {selected && categoryServices.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-violet-200/60 pt-3 dark:border-white/10">
                    {categoryServices.map((service) => {
                      const on = value[category.id].includes(service.id);
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => toggleService(category.id, service.id)}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-medium transition",
                            on
                              ? "bg-violet-600 text-white"
                              : "bg-slate-100 text-slate-500 line-through dark:bg-white/10 dark:text-slate-400"
                          )}
                        >
                          {service.name_en}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <Layers3 className="h-3.5 w-3.5" />
        {t("company_categories_hint", { defaultMessage: "Selected categories start with default settings. The company admin can adjust rules, services and tenant visibility later." })}
      </p>
    </div>
  );
}
