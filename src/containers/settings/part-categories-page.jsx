"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { inventoryApi } from "@/services/inventory/pmms-inventory-api";
import { companiesApi } from "@/services/companies/companies-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { cn } from "@/lib/utils";

export default function PartCategoriesPage() {
  const t = useT("common");
  const isSuper = normalizeRole(useSession().data?.user?.role) === Roles.SUPER_ADMIN;
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ name_en: "", name_ar: "", company_id: "" });

  const load = async () => {
    try {
      const data = await inventoryApi.categories();
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("categories_load_failed", { defaultMessage: "Failed to load categories" })));
    }
  };

  useEffect(() => {
    load();
    if (isSuper) companiesApi.list().then((data) => setCompanies(Array.isArray(data) ? data.filter((row) => !row.archived_at) : [])).catch(() => {});
  }, [isSuper]);

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((row) => row.status === "active").length,
    inactive: rows.filter((row) => row.status !== "active").length,
  }), [rows]);

  const filtered = useMemo(() => {
    if (filter === "active") return rows.filter((row) => row.status === "active");
    if (filter === "inactive") return rows.filter((row) => row.status !== "active");
    return rows;
  }, [rows, filter]);

  const createCategory = async () => {
    try {
      await inventoryApi.createCategory(form);
      setForm({ name_en: "", name_ar: "", company_id: form.company_id });
      toast.success(t("category_created", { defaultMessage: "Category created" }));
      await load();
    } catch (error) {
      toast.error(apiError(error, t("category_save_failed", { defaultMessage: "Unable to save category" })));
    }
  };

  const toggleStatus = async (row) => {
    try {
      await inventoryApi.updateCategory(row.id, { status: row.status === "active" ? "inactive" : "active" });
      await load();
    } catch (error) {
      toast.error(apiError(error, t("category_save_failed", { defaultMessage: "Unable to save category" })));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Layers3}
        title={t("part_categories", { defaultMessage: "Part categories" })}
        description={t("part_categories_desc", { defaultMessage: "Group spare parts for the company catalog." })}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard title={t("categories", { defaultMessage: "Categories" })} value={stats.total} theme="indigo" icon={Layers3} onClick={() => setFilter("all")} />
        <StatCard title={t("active", { defaultMessage: "Active" })} value={stats.active} theme="green" icon={Layers3} onClick={() => setFilter("active")} />
        <StatCard title={t("inactive", { defaultMessage: "Inactive" })} value={stats.inactive} theme="amber" icon={Layers3} onClick={() => setFilter("inactive")} />
      </div>

      <section className="glass-panel grid gap-3 rounded-2xl p-5 md:grid-cols-4">
        {isSuper && (
          <select className="h-10 rounded-md border px-3 text-sm" value={form.company_id} onChange={(event) => setForm((current) => ({ ...current, company_id: event.target.value }))}>
            <option value="">{t("company", { defaultMessage: "Company" })}</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
        )}
        <Input placeholder={t("name_en", { defaultMessage: "Name (EN)" })} value={form.name_en} onChange={(event) => setForm((current) => ({ ...current, name_en: event.target.value }))} />
        <Input placeholder={t("name_ar", { defaultMessage: "Name (AR)" })} value={form.name_ar} onChange={(event) => setForm((current) => ({ ...current, name_ar: event.target.value }))} />
        <Button className="bg-violet-600 hover:bg-violet-700" onClick={createCategory}>{t("add_category", { defaultMessage: "Add category" })}</Button>
      </section>

      <div className="space-y-3">
        {filtered.map((row) => (
          <div key={row.id} className={cn("glass-panel flex items-center justify-between rounded-2xl p-4")}>
            <div>
              <p className="font-semibold">{row.name_en}</p>
              <p className="text-sm text-slate-500">{row.name_ar}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge value={row.status} />
              <Button size="sm" variant="outline" onClick={() => toggleStatus(row)}>
                {row.status === "active" ? t("deactivate", { defaultMessage: "Deactivate" }) : t("activate", { defaultMessage: "Activate" })}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
