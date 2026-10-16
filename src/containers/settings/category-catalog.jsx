"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Layers3, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/pmms/page-header";
import EmptyState from "@/components/pmms/empty-state";
import StatCard from "@/components/common/stat-card";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";
import { useCan } from "@/hooks/use-module-access";

function toDraft(entry) {
  const settings = entry.settings || {};
  return {
    selected: Boolean(entry.selected),
    status: settings.status || "active",
    visible_to_tenant: settings.visible_to_tenant ?? true,
    capacity: settings.capacity ?? 5,
    reopen_window_hours: settings.reopen_window_hours ?? "",
    normal_priority_enabled: settings.normal_priority_enabled ?? true,
    urgent_priority_enabled: settings.urgent_priority_enabled ?? true,
    tenant_reopen_enabled: settings.tenant_reopen_enabled ?? true,
    admin_reopen_enabled: settings.admin_reopen_enabled ?? true,
    admin_reopen_unlimited: settings.admin_reopen_window_hours == null,
    admin_reopen_window_hours: settings.admin_reopen_window_hours ?? "",
    services: (entry.services || []).map((service) => ({
      id: service.id,
      selected: entry.selected ? Boolean(service.selected) : true,
      visible_to_tenant: service.visible_to_tenant ?? true,
    })),
  };
}

function toNumber(value) {
  return value === "" || value == null ? null : Number(value);
}

export default function CategoryCatalog() {
  const t = useT("common");
  const canEdit = useCan()("Edit Categories");
  const [entries, setEntries] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await complaintsApi.categoryCatalog();
      const rows = Array.isArray(data) ? data : [];
      setEntries(rows);
      setDrafts(Object.fromEntries(rows.map((row) => [row.id, toDraft(row)])));
    } catch (error) {
      toast.error(apiError(error, t("categories_load_failed", { defaultMessage: "Failed to load categories" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: entries.length,
    selected: entries.filter((row) => row.selected).length,
    services: entries.reduce((sum, row) => sum + (row.services || []).filter((service) => service.selected).length, 0),
  }), [entries]);

  const updateDraft = (id, patch) => setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  const updateService = (id, serviceId, patch) => setDrafts((current) => ({
    ...current,
    [id]: {
      ...current[id],
      services: current[id].services.map((service) => (service.id === serviceId ? { ...service, ...patch } : service)),
    },
  }));

  const replaceEntry = (entry) => {
    setEntries((current) => current.map((row) => (row.id === entry.id ? entry : row)));
    setDrafts((current) => ({ ...current, [entry.id]: toDraft(entry) }));
  };

  const save = async (entry, overrideSelected) => {
    const draft = drafts[entry.id];
    const selected = overrideSelected ?? draft.selected;

    if (selected && draft.tenant_reopen_enabled && !draft.reopen_window_hours) {
      toast.error(t("tenant_reopen_limit_required", { defaultMessage: "Set the tenant reopen time limit, or turn tenant reopen off." }));
      return;
    }
    if (selected && draft.admin_reopen_enabled && !draft.admin_reopen_unlimited && !draft.admin_reopen_window_hours) {
      toast.error(t("admin_reopen_limit_required", { defaultMessage: "Set the admin/supervisor reopen time limit, or choose Unlimited." }));
      return;
    }

    setSavingId(entry.id);
    try {
      const payload = selected
        ? {
            selected: true,
            status: draft.status,
            visible_to_tenant: Boolean(draft.visible_to_tenant),
            capacity: toNumber(draft.capacity),
            reopen_window_hours: toNumber(draft.reopen_window_hours),
            normal_priority_enabled: Boolean(draft.normal_priority_enabled),
            urgent_priority_enabled: Boolean(draft.urgent_priority_enabled),
            tenant_reopen_enabled: Boolean(draft.tenant_reopen_enabled),
            admin_reopen_enabled: Boolean(draft.admin_reopen_enabled),
            admin_reopen_window_hours: draft.admin_reopen_unlimited ? null : toNumber(draft.admin_reopen_window_hours),
            services: draft.services.map((service) => ({
              id: service.id,
              selected: Boolean(service.selected),
              visible_to_tenant: Boolean(service.visible_to_tenant),
            })),
          }
        : { selected: false };
      const updated = await complaintsApi.saveCategorySelection(entry.id, payload);
      replaceEntry(updated);
      toast.success(t("category_selection_saved", { defaultMessage: "Category selection saved" }));
      if (!selected) setExpanded(null);
    } catch (error) {
      toast.error(apiError(error, t("category_save_failed", { defaultMessage: "Unable to save category" })));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Layers3}
        title={t("company_categories_title", { defaultMessage: "Categories & services" })}
        description={t("company_categories_desc", { defaultMessage: "Select the categories and services your company uses from the master list, then set your own rules for each one." })}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard title={t("master_categories", { defaultMessage: "Available categories" })} value={stats.total} theme="indigo" icon={Layers3} />
        <StatCard title={t("selected_categories", { defaultMessage: "Selected" })} value={stats.selected} theme="green" icon={Layers3} />
        <StatCard title={t("enabled_services", { defaultMessage: "Enabled services" })} value={stats.services} theme="purple" icon={Layers3} />
      </div>

      {loading ? (
        <div className="glass-panel h-64 animate-pulse rounded-2xl" />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Layers3}
          title={t("no_master_categories", { defaultMessage: "No master categories yet" })}
          description={t("no_master_categories_desc", { defaultMessage: "Ask the platform administrator to add categories to the master list." })}
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const draft = drafts[entry.id];
            if (!draft) return null;
            const isOpen = expanded === entry.id;
            const saving = savingId === entry.id;

            return (
              <div key={entry.id} className="glass-panel overflow-hidden rounded-2xl border-l-4" style={{ borderLeftColor: entry.color || "#0EA5E9" }}>
                <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <button type="button" className="flex min-w-0 items-center gap-3 text-left" onClick={() => setExpanded(isOpen ? null : entry.id)}>
                    <div className="h-10 w-10 shrink-0 rounded-xl" style={{ backgroundColor: entry.color || "#0EA5E9" }} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{entry.name_en}</h3>
                        {entry.selected ? (
                          <span className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            entry.settings?.status === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
                          )}>
                            {entry.settings?.status === "active"
                              ? t("selected_active", { defaultMessage: "Selected · Active" })
                              : t("selected_inactive", { defaultMessage: "Selected · Inactive" })}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-white/10 dark:text-slate-400">
                            {t("not_selected", { defaultMessage: "Not selected" })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {entry.name_ar} · {entry.code} · {(entry.services || []).length} {t("services", { defaultMessage: "services" })}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <Switch
                        checked={draft.selected}
                        disabled={saving || !canEdit}
                        onCheckedChange={(checked) => {
                          if (!checked && entry.selected) {
                            updateDraft(entry.id, { selected: false });
                            save(entry, false);
                            return;
                          }
                          updateDraft(entry.id, { selected: checked });
                          if (checked) setExpanded(entry.id);
                        }}
                      />
                      {t("use_category", { defaultMessage: "Use" })}
                    </label>
                    <Button size="icon" variant="ghost" onClick={() => setExpanded(isOpen ? null : entry.id)}>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-200/70 px-5 py-5 dark:border-white/10">
                    {!draft.selected ? (
                      <p className="text-sm text-slate-500">
                        {t("select_category_hint", { defaultMessage: "Turn on “Use” to select this category and configure it for your company." })}
                      </p>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <Field label={t("status", { defaultMessage: "Status" })}>
                            <Select value={draft.status} onValueChange={(value) => updateDraft(entry.id, { status: value })}>
                              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">{t("active", { defaultMessage: "Active" })}</SelectItem>
                                <SelectItem value="inactive">{t("inactive", { defaultMessage: "Inactive" })}</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field label={t("capacity", { defaultMessage: "Daily capacity" })}>
                            <Input className="h-10 rounded-xl" inputMode="numeric" value={draft.capacity ?? ""} onChange={(event) => updateDraft(entry.id, { capacity: event.target.value })} />
                          </Field>
                          <Field label={t("reopen_window_duration", { defaultMessage: "Reopen window duration (hours)" })} hint={t("reopen_window_duration_hint", { defaultMessage: "Also the tenant reopen time limit." })}>
                            <Input className="h-10 rounded-xl" inputMode="numeric" value={draft.reopen_window_hours ?? ""} onChange={(event) => updateDraft(entry.id, { reopen_window_hours: event.target.value })} />
                          </Field>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <Toggle
                            label={t("visible_to_tenant", { defaultMessage: "Visible to Tenant" })}
                            description={t("visible_to_tenant_desc", { defaultMessage: "When disabled, tenants cannot select this category." })}
                            checked={draft.visible_to_tenant}
                            onChange={(checked) => updateDraft(entry.id, { visible_to_tenant: checked })}
                          />
                          <Toggle
                            label={t("normal_priority", { defaultMessage: "Normal priority" })}
                            checked={draft.normal_priority_enabled}
                            onChange={(checked) => updateDraft(entry.id, { normal_priority_enabled: checked })}
                          />
                          <Toggle
                            label={t("urgent_priority", { defaultMessage: "Urgent priority" })}
                            checked={draft.urgent_priority_enabled}
                            onChange={(checked) => updateDraft(entry.id, { urgent_priority_enabled: checked })}
                          />
                          <Toggle
                            label={t("tenant_reopen", { defaultMessage: "Tenant reopen" })}
                            description={t("tenant_reopen_desc", { defaultMessage: "Tenants can reopen a closed job within the reopen window." })}
                            checked={draft.tenant_reopen_enabled}
                            onChange={(checked) => updateDraft(entry.id, { tenant_reopen_enabled: checked })}
                          />
                          <div className="rounded-xl border border-slate-200/80 p-4 dark:border-white/10 md:col-span-2">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold">{t("admin_reopen", { defaultMessage: "Admin/Supervisor reopen" })}</p>
                                <p className="text-xs text-slate-500">{t("admin_reopen_desc", { defaultMessage: "Company admins and supervisors can reopen closed jobs." })}</p>
                              </div>
                              <Switch checked={draft.admin_reopen_enabled} onCheckedChange={(checked) => updateDraft(entry.id, { admin_reopen_enabled: checked })} />
                            </div>
                            {draft.admin_reopen_enabled && (
                              <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <Field label={t("admin_reopen_limit", { defaultMessage: "Admin/Supervisor reopen time limit" })}>
                                  <Select
                                    value={draft.admin_reopen_unlimited ? "unlimited" : "specific"}
                                    onValueChange={(value) => updateDraft(entry.id, { admin_reopen_unlimited: value === "unlimited" })}
                                  >
                                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unlimited">{t("unlimited", { defaultMessage: "Unlimited" })}</SelectItem>
                                      <SelectItem value="specific">{t("specific_time_limit", { defaultMessage: "Specific time limit" })}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </Field>
                                {!draft.admin_reopen_unlimited && (
                                  <Field label={t("hours", { defaultMessage: "Hours" })}>
                                    <Input
                                      className="h-10 rounded-xl"
                                      inputMode="numeric"
                                      value={draft.admin_reopen_window_hours ?? ""}
                                      onChange={(event) => updateDraft(entry.id, { admin_reopen_window_hours: event.target.value })}
                                    />
                                  </Field>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{t("services", { defaultMessage: "Services" })}</p>
                          <p className="mb-3 text-xs text-slate-500">
                            {t("company_services_hint", { defaultMessage: "Enable the services your company offers in this category. Services are created by the platform administrator." })}
                          </p>
                          {draft.services.length === 0 ? (
                            <p className="text-sm text-slate-400">{t("no_services", { defaultMessage: "No services yet" })}</p>
                          ) : (
                            <div className="divide-y divide-slate-200/70 rounded-xl border border-slate-200/80 dark:divide-white/10 dark:border-white/10">
                              {draft.services.map((service) => {
                                const master = entry.services.find((item) => item.id === service.id);
                                return (
                                  <div key={service.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                                    <label className="flex min-w-0 items-center gap-3 text-sm">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={service.selected}
                                        onChange={(event) => updateService(entry.id, service.id, { selected: event.target.checked })}
                                      />
                                      <span className="font-medium">{master?.name_en}</span>
                                      <span className="text-xs text-slate-400">{master?.code}</span>
                                    </label>
                                    <label className={cn("flex items-center gap-2 text-xs", !service.selected && "opacity-50")}>
                                      {t("visible_to_tenant", { defaultMessage: "Visible to Tenant" })}
                                      <Switch
                                        checked={service.visible_to_tenant}
                                        disabled={!service.selected}
                                        onCheckedChange={(checked) => updateService(entry.id, service.id, { visible_to_tenant: checked })}
                                      />
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {canEdit && <div className="flex justify-end">
                          <Button className="rounded-full bg-violet-600 hover:bg-violet-700" disabled={saving} onClick={() => save(entry)}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {t("save_changes", { defaultMessage: "Save changes" })}
                          </Button>
                        </div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200/80 p-4 dark:border-white/10">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </div>
      <Switch checked={Boolean(checked)} onCheckedChange={onChange} />
    </div>
  );
}
