"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Layers3, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { SearchableEnumDropdown } from "@/components/form-fields";

export default function AssetCategoriesPage() {
  const t = useT("common");
  const isSuper = normalizeRole(useSession().data?.user?.role) === Roles.SUPER_ADMIN;
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ name_en: "", name_ar: "", company_id: "" });
  const [subForm, setSubForm] = useState({ category_id: "", name_en: "", name_ar: "" });
  const [editCategory, setEditCategory] = useState(null);
  const [editSubcategory, setEditSubcategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

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
      const created = await assetsApi.createCategory(form);
      setForm({ name_en: "", name_ar: "", company_id: form.company_id });
      toast.success(t("category_created", { defaultMessage: "Category created" }));
      setCategoryModalOpen(false);
      if (created?.id) setSubForm((prev) => ({ ...prev, category_id: created.id }));
      await load();
    } catch (error) {
      toast.error(apiError(error, t("category_save_failed", { defaultMessage: "Unable to save category" })));
    }
  };

  const saveCategory = async () => {
    if (!editCategory?.name_en) return;
    setSaving(true);
    try {
      await assetsApi.updateCategory(editCategory.id, {
        name_en: editCategory.name_en,
        name_ar: editCategory.name_ar || editCategory.name_en,
      });
      toast.success(t("category_updated", { defaultMessage: "Category updated" }));
      setEditCategory(null);
      await load();
    } catch (error) {
      toast.error(apiError(error, t("category_save_failed", { defaultMessage: "Unable to save category" })));
    } finally {
      setSaving(false);
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

  const saveSubcategory = async () => {
    if (!editSubcategory?.name_en || !editSubcategory?.category_id) return;
    setSaving(true);
    try {
      await assetsApi.updateSubcategory(editSubcategory.id, {
        category_id: editSubcategory.category_id,
        name_en: editSubcategory.name_en,
        name_ar: editSubcategory.name_ar || editSubcategory.name_en,
      });
      toast.success(t("subcategory_updated", { defaultMessage: "Subcategory updated" }));
      setEditSubcategory(null);
      await load();
    } catch (error) {
      toast.error(apiError(error, t("category_save_failed", { defaultMessage: "Unable to save subcategory" })));
    } finally {
      setSaving(false);
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

      <div className="flex justify-end"><Button onClick={() => setSubModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> {t("add_subcategory", { defaultMessage: "Add subcategory" })}</Button></div>

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditCategory({ id: row.id, name_en: row.name_en || "", name_ar: row.name_ar || "" })}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" /> {t("edit", { defaultMessage: "Edit" })}
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleStatus(row)}>
                  {row.status === "active" ? t("deactivate", { defaultMessage: "Deactivate" }) : t("activate", { defaultMessage: "Activate" })}
                </Button>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {(row.subcategories || []).map((sub) => (
                <div key={sub.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/70 px-3 py-2 dark:border-white/10">
                  <div>
                    <p className="text-sm font-medium">{sub.name_en}</p>
                    {sub.name_ar ? <p className="text-xs text-slate-500">{sub.name_ar}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={sub.status} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditSubcategory({
                        id: sub.id,
                        category_id: sub.category_id || row.id,
                        name_en: sub.name_en || "",
                        name_ar: sub.name_ar || "",
                      })}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" /> {t("edit", { defaultMessage: "Edit" })}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleSub(sub)}>
                      {sub.status === "active" ? t("deactivate", { defaultMessage: "Deactivate" }) : t("activate", { defaultMessage: "Activate" })}
                    </Button>
                  </div>
                </div>
              ))}
              {(row.subcategories || []).length === 0 && <p className="text-xs text-slate-500">{t("no_subcategories", { defaultMessage: "No subcategories yet." })}</p>}
            </div>
          </article>
        ))}
      </div>

      <Dialog open={!!editCategory} onOpenChange={(open) => !open && setEditCategory(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("edit_category", { defaultMessage: "Edit category" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span>{t("name_en", { defaultMessage: "English name" })}</span>
              <input
                className="w-full rounded-lg border bg-transparent px-3 py-2"
                value={editCategory?.name_en || ""}
                onChange={(event) => setEditCategory((prev) => ({ ...prev, name_en: event.target.value }))}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>{t("name_ar", { defaultMessage: "Arabic name" })}</span>
              <input
                className="w-full rounded-lg border bg-transparent px-3 py-2"
                value={editCategory?.name_ar || ""}
                onChange={(event) => setEditCategory((prev) => ({ ...prev, name_ar: event.target.value }))}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCategory(null)}>{t("cancel", { defaultMessage: "Cancel" })}</Button>
            <Button className="bg-violet-600 hover:bg-violet-700" disabled={saving || !editCategory?.name_en} onClick={saveCategory}>
              {t("save_changes", { defaultMessage: "Save changes" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={subModalOpen} onOpenChange={setSubModalOpen}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader><DialogTitle>Add subcategory</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1"><SearchableEnumDropdown name="new-subcategory-parent" label="Parent category" placeholder="Select category" searchPlaceholder="Search categories..." value={subForm.category_id} onChange={(value) => setSubForm((prev) => ({ ...prev, category_id: value }))} options={rows.filter((row) => row.status === "active").map((row) => ({ value: row.id, label: row.name_en, searchText: `${row.name_en} ${row.name_ar || ""}`.toLowerCase() }))} className="mb-0" /></div>
              <Button type="button" variant="outline" className="mb-0 h-10 w-10 shrink-0 self-end px-0" aria-label="Add category" onClick={() => setCategoryModalOpen(true)}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2"><input className="rounded-lg border bg-transparent px-3 py-2 text-sm" placeholder="English name" value={subForm.name_en} onChange={(event) => setSubForm((prev) => ({ ...prev, name_en: event.target.value }))} /><input className="rounded-lg border bg-transparent px-3 py-2 text-sm" placeholder="Arabic name" value={subForm.name_ar} onChange={(event) => setSubForm((prev) => ({ ...prev, name_ar: event.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSubModalOpen(false)}>Cancel</Button><Button className="bg-violet-600 hover:bg-violet-700" onClick={async () => { await createSub(); setSubModalOpen(false); }} disabled={!subForm.category_id || !subForm.name_en}>Add subcategory</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader><DialogTitle>Add category</DialogTitle></DialogHeader>
          <div className="space-y-3"><input className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" placeholder="English name" value={form.name_en} onChange={(event) => setForm((prev) => ({ ...prev, name_en: event.target.value }))} /><input className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" placeholder="Arabic name" value={form.name_ar} onChange={(event) => setForm((prev) => ({ ...prev, name_ar: event.target.value }))} />{isSuper && <select className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm" value={form.company_id} onChange={(event) => setForm((prev) => ({ ...prev, company_id: event.target.value }))}><option value="">Company</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>}</div>
          <DialogFooter><Button variant="outline" onClick={() => setCategoryModalOpen(false)}>Cancel</Button><Button className="bg-violet-600 hover:bg-violet-700" onClick={createCategory} disabled={!form.name_en}>Add category</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editSubcategory} onOpenChange={(open) => !open && setEditSubcategory(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("edit_subcategory", { defaultMessage: "Edit subcategory" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span>{t("parent_category", { defaultMessage: "Parent category" })}</span>
              <select
                className="w-full rounded-lg border bg-transparent px-3 py-2"
                value={editSubcategory?.category_id || ""}
                onChange={(event) => setEditSubcategory((prev) => ({ ...prev, category_id: event.target.value }))}
              >
                {rows.map((row) => (
                  <option key={row.id} value={row.id}>{row.name_en}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span>{t("name_en", { defaultMessage: "English name" })}</span>
              <input
                className="w-full rounded-lg border bg-transparent px-3 py-2"
                value={editSubcategory?.name_en || ""}
                onChange={(event) => setEditSubcategory((prev) => ({ ...prev, name_en: event.target.value }))}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>{t("name_ar", { defaultMessage: "Arabic name" })}</span>
              <input
                className="w-full rounded-lg border bg-transparent px-3 py-2"
                value={editSubcategory?.name_ar || ""}
                onChange={(event) => setEditSubcategory((prev) => ({ ...prev, name_ar: event.target.value }))}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSubcategory(null)}>{t("cancel", { defaultMessage: "Cancel" })}</Button>
            <Button className="bg-violet-600 hover:bg-violet-700" disabled={saving || !editSubcategory?.name_en} onClick={saveSubcategory}>
              {t("save_changes", { defaultMessage: "Save changes" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
