"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Layers3, Pencil, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/pmms/page-header";
import EmptyState from "@/components/pmms/empty-state";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import CategoryCatalog from "./category-catalog";

export default function CategoriesPage() {
  const role = normalizeRole(useSession().data?.user?.role);

  if (!role) return null;
  return role === Roles.SUPER_ADMIN ? <MasterCategoriesPage /> : <CategoryCatalog />;
}

function MasterCategoriesPage() {
  const t = useT("common");
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    try {
      const data = await complaintsApi.categories({ scope: "master" });
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("categories_load_failed", { defaultMessage: "Failed to load categories" })));
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.status === "active").length,
    inactive: rows.filter((row) => row.status !== "active").length,
    services: rows.reduce((sum, row) => sum + (Number(row.services_count) || 0), 0),
  }), [rows]);

  const filtered = useMemo(() => {
    if (filter === "active") return rows.filter((row) => row.status === "active");
    if (filter === "inactive") return rows.filter((row) => row.status !== "active");
    return rows;
  }, [rows, filter]);

  const toggleStatus = async (row) => {
    try {
      if (row.status === "active") {
        await complaintsApi.deactivateCategory(row.id);
        toast.success(t("category_deactivated", { defaultMessage: "Category deactivated" }));
      } else {
        await complaintsApi.restoreCategory(row.id);
        toast.success(t("category_activated", { defaultMessage: "Category activated" }));
      }
      load();
    } catch (error) {
      toast.error(apiError(error, t("category_save_failed", { defaultMessage: "Unable to save category" })));
    }
  };

  const roots = filtered.filter((row) => !row.parent_id || !filtered.some((item) => item.id === row.parent_id));
  const childrenOf = (id) => filtered.filter((row) => row.parent_id === id);

  const CategoryRow = ({ row, depth = 0 }) => (
    <div className="space-y-2" style={{ marginLeft: depth * 24 }}>
      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl border-l-4 p-5" style={{ borderLeftColor: row.color || "#0EA5E9" }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl" style={{ backgroundColor: row.color || "#0EA5E9" }} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{row.name_en}</h3>
              <StatusBadge value={row.status} />
            </div>
            <p className="text-sm text-slate-500">
              {row.name_ar} · {row.code} · {row.services_count ?? 0} {t("services", { defaultMessage: "services" })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push(`/settings/categories/${row.id}/edit`)}>
            <Pencil className="mr-1 h-3.5 w-3.5" /> {t("edit", { defaultMessage: "Edit" })}
          </Button>
          <Button size="sm" variant={row.status === "active" ? "outline" : "default"} onClick={() => toggleStatus(row)}>
            {row.status === "active" ? t("deactivate", { defaultMessage: "Deactivate" }) : t("activate", { defaultMessage: "Activate" })}
          </Button>
        </div>
      </div>
      {childrenOf(row.id).map((child) => <CategoryRow key={child.id} row={child} depth={depth + 1} />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Layers3}
        title={t("master_categories_title", { defaultMessage: "Master categories" })}
        description={t("master_categories_desc", { defaultMessage: "Platform-wide categories. Companies select from this list; only Super Admin can create or edit them." })}
        actions={
          <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push("/settings/categories/create")}>
            <Plus className="mr-2 h-4 w-4" /> {t("new_category", { defaultMessage: "New category" })}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title={t("categories", { defaultMessage: "Categories" })} value={stats.total} theme="indigo" icon={Layers3} />
        <StatCard title={t("active", { defaultMessage: "Active" })} value={stats.active} theme="green" icon={Layers3} />
        <StatCard title={t("inactive", { defaultMessage: "Inactive" })} value={stats.inactive} theme="amber" icon={Layers3} />
        <StatCard title={t("services", { defaultMessage: "Services" })} value={stats.services} theme="purple" icon={Layers3} />
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

      {filtered.length === 0 ? (
        <EmptyState
          icon={Layers3}
          title={t("no_categories", { defaultMessage: "No categories yet" })}
          description={t("no_categories_desc", { defaultMessage: "Create HVAC, Electrical, Plumbing, and other complaint groups first." })}
          actionLabel={t("new_category", { defaultMessage: "New category" })}
          onAction={() => router.push("/settings/categories/create")}
        />
      ) : (
        <div className="space-y-3">
          {roots.map((row) => <CategoryRow key={row.id} row={row} />)}
        </div>
      )}
    </div>
  );
}
