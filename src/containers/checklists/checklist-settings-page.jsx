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
import { pmmsUsersApi } from "@/services/users/pmms-users-api";
import { apiError, formatDate } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useCan } from "@/hooks/use-module-access";

const EMPTY = {
  name: "",
  description: "",
  property_ids: [],
  category_id: "",
  status: "active",
  assignee_role: "",
  assigned_user_id: "",
};

const formFrom = (row) => ({
  name: row.name,
  description: row.description || "",
  property_ids: (row.property_ids || []).map(String),
  category_id: row.category_id || "",
  status: row.status,
  assignee_role: row.assignee_role || "",
  assigned_user_id: row.assigned_user_id ? String(row.assigned_user_id) : "",
});

export default function ChecklistSettingsPage() {
  const t = useT("common");
  const can = useCan();
  const canAdd = can("Add Checklists");
  const canEdit = can("Edit Checklists");
  const [templates, setTemplates] = useState([]);
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [roleUsers, setRoleUsers] = useState({ role: "", list: [] });
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [itemTitle, setItemTitle] = useState({ section: "", title_en: "", title_ar: "" });
  const [reassign, setReassign] = useState({ user_id: "", reason: "" });

  const load = async () => {
    try {
      const data = await checklistsApi.templates({ status: "all" });
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("checklist_load_failed", { defaultMessage: "Failed to load checklists" })));
    }
  };

  const openTemplate = async (id) => {
    setEditing(id);
    try {
      const data = await checklistsApi.showTemplate(id);
      setDetail(data);
      setForm(formFrom(data));
    } catch (error) {
      toast.error(apiError(error, t("checklist_load_failed", { defaultMessage: "Failed to load checklists" })));
    }
  };

  useEffect(() => {
    load();
    propertiesApi.list().then((data) => setProperties(Array.isArray(data) ? data : [])).catch(() => {});
    complaintsApi.categories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const role = form.assignee_role;
    if (!role) return;
    pmmsUsersApi.list({ role })
      .then((data) => setRoleUsers({ role, list: (Array.isArray(data) ? data : []).filter((user) => user.is_active !== false) }))
      .catch(() => {});
  }, [form.assignee_role]);

  const users = roleUsers.role && roleUsers.role === form.assignee_role ? roleUsers.list : [];

  const toggleProperty = (id) => setForm((current) => ({
    ...current,
    property_ids: current.property_ids.includes(id)
      ? current.property_ids.filter((value) => value !== id)
      : [...current.property_ids, id],
  }));

  const saveTemplate = async () => {
    try {
      const saved = await checklistsApi.saveTemplate({
        name: form.name,
        description: form.description,
        status: form.status,
        property_ids: form.property_ids,
        category_id: form.category_id || null,
        assignee_role: form.assignee_role || null,
        assigned_user_id: form.assignee_role && form.assigned_user_id ? Number(form.assigned_user_id) : null,
      }, editing);
      setEditing(saved.id);
      setDetail(saved);
      setForm(formFrom(saved));
      toast.success(t("checklist_saved", { defaultMessage: "Checklist saved" }));
      await load();
    } catch (error) {
      toast.error(apiError(error, t("checklist_save_failed", { defaultMessage: "Unable to save checklist" })));
    }
  };

  const submitReassign = async () => {
    try {
      const saved = await checklistsApi.reassign(editing, {
        user_id: reassign.user_id ? Number(reassign.user_id) : null,
        reason: reassign.reason || null,
      });
      setDetail(saved);
      setForm(formFrom(saved));
      setReassign({ user_id: "", reason: "" });
      toast.success(t("checklist_reassigned", { defaultMessage: "Checklist reassigned" }));
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
      setItemTitle((current) => ({ section: current.section, title_en: "", title_ar: "" }));
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
  const itemGroups = (selected?.items || []).reduce((groups, item) => {
    const key = item.section || "";
    const group = groups.find((entry) => entry.key === key);
    if (group) group.items.push(item);
    else groups.push({ key, items: [item] });
    return groups;
  }, []);
  const sections = [...new Set((selected?.items || []).map((item) => item.section).filter(Boolean))];
  const roleLabel = (role) => (role === "supervisor"
    ? t("supervisor", { defaultMessage: "Supervisor" })
    : t("technician", { defaultMessage: "Technician" }));
  const savedRole = detail?.assignee_role || "";

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
        <div className="space-y-1 text-sm md:col-span-2">
          <span className="text-slate-500">{t("properties", { defaultMessage: "Properties" })}</span>
          <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-md border p-3">
            {properties.length === 0 && <span className="text-xs text-slate-400">{t("all_properties", { defaultMessage: "All properties" })}</span>}
            {properties.map((row) => {
              const id = String(row.id);
              const checked = form.property_ids.includes(id);
              return (
                <label key={id} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs ${checked ? "border-violet-500 bg-violet-50 text-violet-700" : ""}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleProperty(id)} />
                  {row.name}
                </label>
              );
            })}
          </div>
          <p className="text-xs text-slate-400">{t("checklist_properties_hint", { defaultMessage: "Leave empty to use this checklist for all properties." })}</p>
        </div>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("category", { defaultMessage: "Category" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={form.category_id} onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}>
            <option value="">{t("all_categories", { defaultMessage: "All categories" })}</option>
            {categories.map((row) => <option key={row.id} value={row.id}>{row.name_en}</option>)}
          </select>
        </label>
        <div className="space-y-1 text-sm">
          <span className="text-slate-500">{t("checklist_to", { defaultMessage: "Checklist to" })}</span>
          <div className="flex h-10 items-center gap-4">
            {["supervisor", "technician"].map((role) => (
              <label key={role} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="assignee_role"
                  checked={form.assignee_role === role}
                  onChange={() => setForm((current) => ({ ...current, assignee_role: role, assigned_user_id: "" }))}
                />
                {roleLabel(role)}
              </label>
            ))}
          </div>
        </div>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-slate-500">{t("responsible_user", { defaultMessage: "Responsible user" })}</span>
          <select
            className="h-10 w-full rounded-md border px-3 text-sm"
            value={form.assigned_user_id}
            disabled={!form.assignee_role}
            onChange={(event) => setForm((current) => ({ ...current, assigned_user_id: event.target.value }))}
          >
            <option value="">
              {form.assignee_role
                ? t("any_user_with_role", { defaultMessage: "Any {role}", role: roleLabel(form.assignee_role) })
                : t("select_checklist_to_first", { defaultMessage: "Choose Supervisor or Technician first" })}
            </option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
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
          {canAdd && <Button variant="outline" onClick={() => { setEditing(null); setDetail(null); setForm(EMPTY); }}>{t("new", { defaultMessage: "New" })}</Button>}
          {(editing ? canEdit : canAdd) && <Button className="bg-violet-600 hover:bg-violet-700" onClick={saveTemplate}>{t("save", { defaultMessage: "Save" })}</Button>}
        </div>
      </section>

      {canEdit && editing && savedRole && (
        <section className="glass-panel space-y-3 rounded-2xl p-5">
          <div>
            <h3 className="font-semibold">{t("reassign_checklist", { defaultMessage: "Reassign checklist" })}</h3>
            <p className="text-sm text-slate-500">
              {t("currently_assigned_to", { defaultMessage: "Currently assigned to" })}:{" "}
              <span className="font-medium text-slate-700">{detail?.assigned_user?.name || t("any_user_with_role", { defaultMessage: "Any {role}", role: roleLabel(savedRole) })}</span>
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <select className="h-10 w-full rounded-md border px-3 text-sm" value={reassign.user_id} onChange={(event) => setReassign((current) => ({ ...current, user_id: event.target.value }))}>
              <option value="">{t("any_user_with_role", { defaultMessage: "Any {role}", role: roleLabel(savedRole) })}</option>
              {(form.assignee_role === savedRole ? users : []).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
            <Input
              placeholder={t("reassign_reason", { defaultMessage: "Reason (optional)" })}
              value={reassign.reason}
              onChange={(event) => setReassign((current) => ({ ...current, reason: event.target.value }))}
            />
            <Button variant="outline" onClick={submitReassign}>{t("reassign", { defaultMessage: "Reassign" })}</Button>
          </div>
          {(detail?.assignment_history || []).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-slate-500">{t("assignment_history", { defaultMessage: "Assignment history" })}</p>
              {detail.assignment_history.map((row) => (
                <div key={row.id} className="rounded-xl border px-3 py-2 text-sm">
                  <p>
                    {row.from_user_name || "—"} → <span className="font-medium">{row.to_user_name || t("any_user_with_role", { defaultMessage: "Any {role}", role: roleLabel(savedRole) })}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {row.assigned_by_name} · {formatDate(row.created_at)}{row.reason ? ` · ${row.reason}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {editing && (
        <section className="glass-panel grid gap-3 rounded-2xl p-5 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">{t("checklist_section", { defaultMessage: "Section" })}</span>
            <Input
              list="checklist-sections"
              placeholder={t("checklist_section_placeholder", { defaultMessage: "e.g. Pool Area" })}
              value={itemTitle.section}
              onChange={(event) => setItemTitle((current) => ({ ...current, section: event.target.value }))}
            />
            <datalist id="checklist-sections">
              {sections.map((section) => <option key={section} value={section} />)}
            </datalist>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">{t("item_en", { defaultMessage: "Item (English)" })}</span>
            <Input value={itemTitle.title_en} onChange={(event) => setItemTitle((current) => ({ ...current, title_en: event.target.value }))} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">{t("item_ar", { defaultMessage: "Item (Arabic)" })}</span>
            <Input value={itemTitle.title_ar} onChange={(event) => setItemTitle((current) => ({ ...current, title_ar: event.target.value }))} />
          </label>
          {canEdit && <div className="md:col-span-3 flex justify-end">
            <Button onClick={saveItem}>{t("add_item", { defaultMessage: "Add item" })}</Button>
          </div>}
          {itemGroups.map((group) => (
            <div key={group.key || "general"} className="md:col-span-3 space-y-2">
              <p className="text-sm font-semibold text-slate-700">{group.key || t("checklist_general_section", { defaultMessage: "General" })}</p>
              {group.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
                  <div>
                    <p className="font-medium">{item.title_en}</p>
                    <p className="text-xs text-slate-500">{item.title_ar}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={item.status} />
                    {canEdit && (
                      <Button size="sm" variant="outline" onClick={() => toggleItem(item)}>
                        {item.status === "active" ? t("deactivate", { defaultMessage: "Deactivate" }) : t("activate", { defaultMessage: "Activate" })}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      <div className="space-y-2">
        {templates.map((row) => (
          <button key={row.id} type="button" className="glass-panel flex w-full justify-between rounded-2xl p-4 text-start" onClick={() => openTemplate(row.id)}>
            <span>
              <span className="font-semibold">{row.name}</span>
              <span className="mt-1 block text-sm text-slate-500">
                {row.property_name || t("all_properties", { defaultMessage: "All properties" })} · {row.active_item_count} {t("active_items", { defaultMessage: "active items" })}
              </span>
              {row.assignee_role && (
                <span className="mt-1 block text-xs text-slate-500">
                  {roleLabel(row.assignee_role)} · {row.assigned_user?.name || t("any_user_with_role", { defaultMessage: "Any {role}", role: roleLabel(row.assignee_role) })}
                </span>
              )}
            </span>
            <StatusBadge value={row.status} />
          </button>
        ))}
      </div>
    </div>
  );
}
