"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/pmms/page-header";
import EmptyState from "@/components/pmms/empty-state";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";

export default function ServicesPage() {
  const t = useT("common");
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const load = async () => {
    try {
      const [services, cats] = await Promise.all([complaintsApi.services(), complaintsApi.categories()]);
      setRows(Array.isArray(services) ? services : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      toast.error(apiError(error, t("services_load_failed", { defaultMessage: "Failed to load services" })));
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.status === "active").length,
    inactive: rows.filter((row) => row.status !== "active").length,
    categories: new Set(rows.map((row) => row.category_id)).size,
  }), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (filter === "active" && row.status !== "active") return false;
      if (filter === "inactive" && row.status === "active") return false;
      if (categoryFilter !== "all" && row.category_id !== categoryFilter) return false;
      return true;
    });
  }, [rows, filter, categoryFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wrench}
        title={t("services_title", { defaultMessage: "Services" })}
        description={t("services_desc", { defaultMessage: "Services belong to a category and appear on complaints and work orders." })}
        actions={
          <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push("/settings/services/create")}>
            <Plus className="mr-2 h-4 w-4" /> {t("new_service", { defaultMessage: "New service" })}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title={t("services", { defaultMessage: "Services" })} value={stats.total} theme="purple" icon={Wrench} />
        <StatCard title={t("active", { defaultMessage: "Active" })} value={stats.active} theme="green" icon={Wrench} />
        <StatCard title={t("inactive", { defaultMessage: "Inactive" })} value={stats.inactive} theme="amber" icon={Wrench} />
        <StatCard title={t("categories", { defaultMessage: "Categories" })} value={stats.categories} theme="indigo" icon={Wrench} />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: t("all", { defaultMessage: "All" }), count: stats.total },
          { id: "active", label: t("active", { defaultMessage: "Active" }), count: stats.active },
          { id: "inactive", label: t("inactive", { defaultMessage: "Inactive" }), count: stats.inactive },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              filter === item.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
            )}
          >
            {item.label} · {item.count}
          </button>
        ))}
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              categoryFilter === "all" ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200"
            )}
          >
            {t("all_categories", { defaultMessage: "All categories" })}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryFilter(category.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold",
                categoryFilter === category.id ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200"
              )}
            >
              {category.name_en}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={t("no_services", { defaultMessage: "No services yet" })}
          description={t("no_services_desc", { defaultMessage: "Create a category first, then add services such as AC repair or leak fix." })}
          actionLabel={t("new_service", { defaultMessage: "New service" })}
          onAction={() => router.push("/settings/services/create")}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
            <div key={row.id} className="glass-panel rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{row.name_en}</h3>
                    <StatusBadge value={row.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {row.name_ar} · {row.code}
                    {row.description ? ` · ${row.description}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
                      {row.category_name || t("uncategorized", { defaultMessage: "No category" })}
                    </span>
                    {row.category_code && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {row.category_code}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => router.push(`/settings/services/${row.id}/edit`)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> {t("edit", { defaultMessage: "Edit" })}
                  </Button>
                  {row.status === "active" ? (
                    <Button size="sm" variant="outline" onClick={async () => {
                      try {
                        await complaintsApi.deactivateService(row.id);
                        toast.success(t("service_deactivated", { defaultMessage: "Service deactivated" }));
                        load();
                      } catch (error) {
                        toast.error(apiError(error, "Unable to deactivate"));
                      }
                    }}>
                      {t("deactivate", { defaultMessage: "Deactivate" })}
                    </Button>
                  ) : (
                    <Button size="sm" onClick={async () => {
                      try {
                        await complaintsApi.restoreService(row.id);
                        toast.success(t("service_activated", { defaultMessage: "Service activated" }));
                        load();
                      } catch (error) {
                        toast.error(apiError(error, "Unable to activate"));
                      }
                    }}>
                      {t("activate", { defaultMessage: "Activate" })}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
