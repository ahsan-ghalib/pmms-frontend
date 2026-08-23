"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Layers3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { assetsApi } from "@/services/assets/assets-api";
import { companiesApi } from "@/services/companies/companies-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { cn } from "@/lib/utils";

export default function AssetCategoriesPage() {
  const t = useT("common");
  const isSuper = normalizeRole(useSession().data?.user?.role) === Roles.SUPER_ADMIN;
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ name_en: "", name_ar: "", company_id: "" });
  const [subForm, setSubForm] = useState({ category_id: "", name_en: "", name_ar: "" });

  const load = async () => {
    try {
      const data = await assetsApi.categories({ include_inactive: true });
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
    subs: rows.reduce((sum, row) => sum + (row.subcategories?.length || 0), 0),
  }), [rows]);

  const filtered = useMemo(() => {
    if (filter === "active") return rows.filter((row) => row.status === "active");
    if (filter === "inactive") return rows.filter((row) => row.status !== "active");
    return rows;
  }, [rows, filter]);

  const createCategory = async () => {
    try {
      await assetsApi.createCategory(form);
      setForm({ name_en: "", name_ar: "", company_id: form.company_id });
      toast.success(t("category_created", { defaultMessage: "Category created" }));
      await load();
    } catch (error) {
      toast.error(apiError(error, t("category_save_failed", { defaultMessage: "Unable to save category" })));
    }
  };

  const toggleStatus = async (row) => {
    try {
      await assetsApi.updateCategory(row.id, { status: row.status === "active" ? "inactive" : "active" });
      await load();
    } catch (error) {
      toast.error(apiError(error, t("category_save_failed", { defaultMessage: "Unable to save category" })));
    }
  };

  const createSub = async () => {
    try {
      await assetsApi.createSubcategory(subForm.category_id, { name_en: subForm.name_en, name_ar: subForm.name_ar });
      setSubForm({ category_id: subForm.category_id, name_en: "", name_ar: "" });
      toast.success(t("subcategory_created", { defaultMessage: "Subcategory created" }));
      await load();
    } catch (error) {
      toast.error(apiError(error, t("category_save_failed", { defaultMessage: "Unable to save subcategory" })));
    }
  };

  const toggleSub = async (sub) => {
    try {
      await assetsApi.updateSubcategory(sub.id, { status: sub.status === "active" ? "inactive" : "active" });
      await load();
    } catch (error) {
      toast.error(apiError(error, t("category_save_failed", { defaultMessage: "Unable to save subcategory" })));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Layers3}
        title={t("asset_categories", { defaultMessage: "Asset categories" })}
        description={t("asset_categories_desc", { defaultMessage: "Inactive classifications stay on historical assets and cannot be used for new registrations." })}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title={t("categories", { defaultMessage: "Categories" })} value={stats.total} theme="indigo" icon={Layers3} />
        <StatCard title={t("active", { defaultMessage: "Active" })} value={stats.active} theme="green" icon={Layers3} />
        <StatCard title={t("inactive", { defaultMessage: "Inactive" })} value={stats.inactive} theme="amber" icon={Layers3} />
        <StatCard title={t("subcategories", { defaultMessage: "Subcategories" })} value={stats.subs} theme="purple" icon={Layers3} />
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
              filter === item.id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
            )}
          >
            {item.label} · {item.count}
          </button>
        ))}
      </div>

      <section className="glass-panel grid gap-3 rounded-2xl p-6 md:grid-cols-4">
        {isSuper && (
          <select className="rounded-lg border bg-transparent px-3 py-2 text-sm" value={form.company_id} onChange={(event) => setForm((prev) => ({ ...prev, company_id: event.target.value }))}>
            <option value="">{t("company", { defaultMessage: "Company" })}</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
        )}
        <input className="rounded-lg border bg-transparent px-3 py-2 text-sm" placeholder={t("name_en", { defaultMessage: "Name (EN)" })} value={form.name_en} onChange={(event) => setForm((prev) => ({ ...prev, name_en: event.target.value }))} />
        <input className="rounded-lg border bg-transparent px-3 py-2 text-sm" placeholder={t("name_ar", { defaultMessage: "Name (AR)" })} value={form.name_ar} onChange={(event) => setForm((prev) => ({ ...prev, name_ar: event.target.value }))} />
        <Button onClick={createCategory} disabled={!form.name_en}><Plus className="mr-2 h-4 w-4" /> {t("add_category", { defaultMessage: "Add category" })}</Button>
      </section>

      <section className="glass-panel grid gap-3 rounded-2xl p-6 md:grid-cols-4">
        <select className="rounded-lg border bg-transparent px-3 py-2 text-sm" value={subForm.category_id} onChange={(event) => setSubForm((prev) => ({ ...prev, category_id: event.target.value }))}>
          <option value="">{t("category", { defaultMessage: "Category" })}</option>
          {rows.filter((row) => row.status === "active").map((row) => <option key={row.id} value={row.id}>{row.name_en}</option>)}
        </select>
        <input className="rounded-lg border bg-transparent px-3 py-2 text-sm" placeholder={t("name_en", { defaultMessage: "Name (EN)" })} value={subForm.name_en} onChange={(event) => setSubForm((prev) => ({ ...prev, name_en: event.target.value }))} />
        <input className="rounded-lg border bg-transparent px-3 py-2 text-sm" placeholder={t("name_ar", { defaultMessage: "Name (AR)" })} value={subForm.name_ar} onChange={(event) => setSubForm((prev) => ({ ...prev, name_ar: event.target.value }))} />
        <Button onClick={createSub} disabled={!subForm.category_id || !subForm.name_en}><Plus className="mr-2 h-4 w-4" /> {t("add_subcategory", { defaultMessage: "Add subcategory" })}</Button>
      </section>

      <div className="space-y-3">
        {filtered.map((row) => (
          <article key={row.id} className="glass-panel rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{row.name_en}</p>
                {row.name_ar && <p className="text-sm text-slate-500">{row.name_ar}</p>}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={row.status} />
                <Button variant="outline" size="sm" onClick={() => toggleStatus(row)}>
                  {row.status === "active" ? t("deactivate", { defaultMessage: "Deactivate" }) : t("activate", { defaultMessage: "Activate" })}
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(row.subcategories || []).map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => toggleSub(sub)}
                  className="rounded-full border px-3 py-1 text-xs"
                >
                  {sub.name_en} · {sub.status}
                </button>
              ))}
              {(row.subcategories || []).length === 0 && <p className="text-xs text-slate-500">{t("no_subcategories", { defaultMessage: "No subcategories yet." })}</p>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
