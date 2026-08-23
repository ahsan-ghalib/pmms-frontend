"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/pmms/page-header";
import { StatusBadge } from "@/components/pmms/status-badge";
import { checklistsApi } from "@/services/checklists/checklists-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

const EMPTY = { name: "", description: "", property_id: "", category_id: "", status: "active" };

export default function ChecklistSettingsPage() {
  const t = useT("common");
  const [templates, setTemplates] = useState([]);
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [itemTitle, setItemTitle] = useState({ title_en: "", title_ar: "" });

  const load = async () => {
    try {
      const data = await checklistsApi.templates({ status: "all" });
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("checklist_load_failed", { defaultMessage: "Failed to load checklists" })));
    }
  };

  useEffect(() => {
    load();
    propertiesApi.list().then((data) => setProperties(Array.isArray(data) ? data : [])).catch(() => {});
    complaintsApi.categories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const saveTemplate = async () => {
    try {
      const saved = await checklistsApi.saveTemplate({
        ...form,
        property_id: form.property_id || null,
        category_id: form.category_id || null,
      }, editing);
      setEditing(saved.id);
      setForm({ name: saved.name, description: saved.description || "", property_id: saved.property_id || "", category_id: saved.category_id || "", status: saved.status });
      toast.success(t("checklist_saved", { defaultMessage: "Checklist saved" }));
      await load();
    } catch (error) {
      toast.error(apiError(error, t("checklist_save_failed", { defaultMessage: "Unable to save checklist" })));
    }
  };

  const saveItem = async () => {
    if (!editing) {
      toast.error(t("save_template_first", { defaultMessage: "Save the checklist first" }));
      return;
    }
    try {
      await checklistsApi.saveItem(editing, itemTitle);
      setItemTitle({ title_en: "", title_ar: "" });
      toast.success(t("checklist_item_saved", { defaultMessage: "Item saved" }));
      await load();
    } catch (error) {
      toast.error(apiError(error, t("checklist_item_failed", { defaultMessage: "Unable to save item" })));
    }
  };

  const toggleItem = async (item) => {
    try {
      await checklistsApi.setItemStatus(item.id, item.status === "active" ? "inactive" : "active");
      await load();
    } catch (error) {
      toast.error(apiError(error, t("checklist_item_failed", { defaultMessage: "Unable to update item" })));
    }
  };

  const selected = templates.find((row) => row.id === editing);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ClipboardCheck}
        title={t("checklist_settings", { defaultMessage: "Daily inspection checklists" })}
        description={t("checklist_settings_desc", { defaultMessage: "Configure items per property or category. Deactivating an item keeps historical results." })}
      />
      <section className="glass-panel grid gap-3 rounded-2xl p-5 md:grid-cols-2">
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-slate-500">{t("name", { defaultMessage: "Name" })}</span>
          <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("property", { defaultMessage: "Property" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={form.property_id} onChange={(event) => setForm((current) => ({ ...current, property_id: event.target.value }))}>
            <option value="">{t("all_properties", { defaultMessage: "All properties" })}</option>
            {properties.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("category", { defaultMessage: "Category" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={form.category_id} onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}>
            <option value="">{t("all_categories", { defaultMessage: "All categories" })}</option>
            {categories.map((row) => <option key={row.id} value={row.id}>{row.name_en}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-slate-500">{t("description", { defaultMessage: "Description" })}</span>
          <textarea className="min-h-20 w-full rounded-md border p-3 text-sm" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.status === "active"} onChange={(event) => setForm((current) => ({ ...current, status: event.target.checked ? "active" : "inactive" }))} />
          {t("active", { defaultMessage: "Active" })}
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setEditing(null); setForm(EMPTY); }}>{t("new", { defaultMessage: "New" })}</Button>
          <Button className="bg-violet-600 hover:bg-violet-700" onClick={saveTemplate}>{t("save", { defaultMessage: "Save" })}</Button>
        </div>
      </section>

      {editing && (
        <section className="glass-panel grid gap-3 rounded-2xl p-5 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">{t("item_en", { defaultMessage: "Item (English)" })}</span>
            <Input value={itemTitle.title_en} onChange={(event) => setItemTitle((current) => ({ ...current, title_en: event.target.value }))} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">{t("item_ar", { defaultMessage: "Item (Arabic)" })}</span>
            <Input value={itemTitle.title_ar} onChange={(event) => setItemTitle((current) => ({ ...current, title_ar: event.target.value }))} />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={saveItem}>{t("add_item", { defaultMessage: "Add item" })}</Button>
          </div>
          {(selected?.items || []).map((item) => (
            <div key={item.id} className="md:col-span-2 flex items-center justify-between rounded-xl border px-3 py-2">
              <div>
                <p className="font-medium">{item.title_en}</p>
                <p className="text-xs text-slate-500">{item.title_ar}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={item.status} />
                <Button size="sm" variant="outline" onClick={() => toggleItem(item)}>
                  {item.status === "active" ? t("deactivate", { defaultMessage: "Deactivate" }) : t("activate", { defaultMessage: "Activate" })}
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="space-y-2">
        {templates.map((row) => (
          <button key={row.id} type="button" className="glass-panel flex w-full justify-between rounded-2xl p-4 text-start" onClick={() => { setEditing(row.id); setForm({ name: row.name, description: row.description || "", property_id: row.property_id || "", category_id: row.category_id || "", status: row.status }); }}>
            <span>
              <span className="font-semibold">{row.name}</span>
              <span className="mt-1 block text-sm text-slate-500">{row.property_name || t("all_properties", { defaultMessage: "All properties" })} · {row.active_item_count} {t("active_items", { defaultMessage: "active items" })}</span>
            </span>
            <StatusBadge value={row.status} />
          </button>
        ))}
      </div>
    </div>
  );
}
