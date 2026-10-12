"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FolderPlus, Layers3, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { platformApi } from "@/services/platform/platform-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";

const EMPTY_GROUP = { key: "", title_en: "", title_ar: "", description_en: "", description_ar: "", sort_order: 0 };
const EMPTY_FEATURE = {
  plan_feature_group_id: "",
  key: "",
  label_en: "",
  label_ar: "",
  description_en: "",
  description_ar: "",
  href: "",
  api_paths: "",
  web_paths: "",
  sort_order: 0,
  is_active: true,
};

const toKey = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const toLines = (list) => (list || []).join("\n");
const fromLines = (text) => String(text || "").split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);

export default function PlanFeaturesPage() {
  const t = useT("common");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupForm, setGroupForm] = useState(null);
  const [featureForm, setFeatureForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    platformApi.featureCatalog()
      .then((data) => setGroups(Array.isArray(data) ? data : []))
      .catch((error) => toast.error(apiError(error, t("plan_features_load_failed", { defaultMessage: "Unable to load features" }))))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    const features = groups.flatMap((group) => group.features || []);
    return {
      groups: groups.length,
      features: features.length,
      active: features.filter((feature) => feature.is_active).length,
      inactive: features.filter((feature) => !feature.is_active).length,
    };
  }, [groups]);

  const run = async (request, message) => {
    setSaving(true);
    try {
      const data = await request();
      setGroups(Array.isArray(data) ? data : []);
      toast.success(message);
      return true;
    } catch (error) {
      toast.error(apiError(error, t("plan_feature_save_failed", { defaultMessage: "Unable to save" })));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveGroup = async () => {
    const { id, key, ...fields } = groupForm;
    const payload = { ...fields, sort_order: Number(fields.sort_order) || 0 };
    const ok = await run(
      () => (id ? platformApi.updateFeatureGroup(id, payload) : platformApi.createFeatureGroup({ ...payload, key: key || toKey(fields.title_en) })),
      t("plan_feature_group_saved", { defaultMessage: "Feature group saved" })
    );
    if (ok) setGroupForm(null);
  };

  const saveFeature = async () => {
    const { id, key, plans_count, ...fields } = featureForm;
    const payload = {
      ...fields,
      href: fields.href || null,
      api_paths: fromLines(fields.api_paths),
      web_paths: fromLines(fields.web_paths),
      sort_order: Number(fields.sort_order) || 0,
    };
    const ok = await run(
      () => (id ? platformApi.updateFeature(id, payload) : platformApi.createFeature({ ...payload, key: key || toKey(fields.label_en) })),
      t("plan_feature_saved", { defaultMessage: "Feature saved" })
    );
    if (ok) setFeatureForm(null);
  };

  const toggleFeature = (feature) => run(
    () => platformApi.updateFeature(feature.id, { is_active: !feature.is_active }),
    feature.is_active
      ? t("plan_feature_deactivated", { defaultMessage: "Feature deactivated" })
      : t("plan_feature_activated", { defaultMessage: "Feature activated" })
  );

  const deleteFeature = (feature) => {
    if (!window.confirm(t("plan_feature_delete_confirm", { defaultMessage: "Delete this feature? This cannot be undone." }))) return;
    run(() => platformApi.deleteFeature(feature.id), t("plan_feature_deleted", { defaultMessage: "Feature deleted" }));
  };

  const deleteGroup = (group) => {
    if (!window.confirm(t("plan_feature_group_delete_confirm", { defaultMessage: "Delete this group?" }))) return;
    run(() => platformApi.deleteFeatureGroup(group.id), t("plan_feature_group_deleted", { defaultMessage: "Feature group deleted" }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Layers3}
        title={t("plan_features_title", { defaultMessage: "Plan features" })}
        description={t("plan_features_desc", { defaultMessage: "The features subscription plans can include. Changes apply to plan screens and feature locks right away." })}
        actions={
          <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => setGroupForm({ ...EMPTY_GROUP, sort_order: (groups.length + 1) * 10 })}>
            <FolderPlus className="mr-2 h-4 w-4" /> {t("new_feature_group", { defaultMessage: "New group" })}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title={t("feature_groups", { defaultMessage: "Groups" })} value={stats.groups} theme="indigo" icon={Layers3} />
        <StatCard title={t("features", { defaultMessage: "Features" })} value={stats.features} theme="purple" icon={Layers3} />
        <StatCard title={t("active", { defaultMessage: "Active" })} value={stats.active} theme="green" icon={Layers3} />
        <StatCard title={t("inactive", { defaultMessage: "Inactive" })} value={stats.inactive} theme="amber" icon={Layers3} />
      </div>

      {loading ? (
        <div className="glass-panel h-64 animate-pulse rounded-2xl" />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.id} className="glass-panel rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {group.title_en}
                    {group.title_ar ? <span className="ml-2 text-sm font-normal text-slate-500">· {group.title_ar}</span> : null}
                  </h3>
                  <p className="text-sm text-slate-500">{group.description_en}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFeatureForm({
                      ...EMPTY_FEATURE,
                      plan_feature_group_id: group.id,
                      sort_order: ((group.features || []).length + 1) * 10,
                    })}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> {t("add_feature", { defaultMessage: "Add feature" })}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setGroupForm({ ...EMPTY_GROUP, ...group })}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={(group.features || []).length > 0} onClick={() => deleteGroup(group)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 divide-y divide-slate-200/70 rounded-xl border border-slate-200/80 dark:divide-white/10 dark:border-white/10">
                {(group.features || []).length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-400">{t("no_features_in_group", { defaultMessage: "No features in this group yet." })}</p>
                ) : group.features.map((feature) => (
                  <div key={feature.id} className={cn("flex flex-wrap items-center justify-between gap-3 px-4 py-3", !feature.is_active && "opacity-60")}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-white">{feature.label_en}</p>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500 dark:bg-white/10">{feature.key}</span>
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
                          {t("used_in_plans", { defaultMessage: "{count} plans", count: feature.plans_count })}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{feature.description_en}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-slate-500">
                        {feature.is_active ? t("active", { defaultMessage: "Active" }) : t("inactive", { defaultMessage: "Inactive" })}
                        <Switch checked={feature.is_active} disabled={saving} onCheckedChange={() => toggleFeature(feature)} />
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setFeatureForm({
                          ...EMPTY_FEATURE,
                          ...feature,
                          api_paths: toLines(feature.api_paths),
                          web_paths: toLines(feature.web_paths),
                          href: feature.href || "",
                        })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" disabled={feature.plans_count > 0} onClick={() => deleteFeature(feature)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={Boolean(groupForm)} onOpenChange={(open) => !open && setGroupForm(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{groupForm?.id ? t("edit_feature_group", { defaultMessage: "Edit group" }) : t("new_feature_group", { defaultMessage: "New group" })}</DialogTitle>
          </DialogHeader>
          {groupForm && (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label={t("name_en", { defaultMessage: "English name" })}>
                <Input value={groupForm.title_en} onChange={(event) => setGroupForm({ ...groupForm, title_en: event.target.value })} />
              </Field>
              <Field label={t("name_ar", { defaultMessage: "Arabic name" })}>
                <Input dir="rtl" value={groupForm.title_ar || ""} onChange={(event) => setGroupForm({ ...groupForm, title_ar: event.target.value })} />
              </Field>
              <Field label={t("feature_key", { defaultMessage: "Key" })} hint={groupForm.id ? t("feature_key_locked", { defaultMessage: "Keys cannot be changed." }) : t("feature_key_hint", { defaultMessage: "Lowercase letters, numbers and dashes. Generated from the name if empty." })}>
                <Input disabled={Boolean(groupForm.id)} value={groupForm.key} placeholder={toKey(groupForm.title_en)} onChange={(event) => setGroupForm({ ...groupForm, key: toKey(event.target.value) })} />
              </Field>
              <Field label={t("sort_order", { defaultMessage: "Sort order" })}>
                <Input inputMode="numeric" value={groupForm.sort_order} onChange={(event) => setGroupForm({ ...groupForm, sort_order: event.target.value })} />
              </Field>
              <div className="md:col-span-2">
                <Field label={t("description_en", { defaultMessage: "English description" })}>
                  <Textarea rows={2} value={groupForm.description_en || ""} onChange={(event) => setGroupForm({ ...groupForm, description_en: event.target.value })} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label={t("description_ar", { defaultMessage: "Arabic description" })}>
                  <Textarea dir="rtl" rows={2} value={groupForm.description_ar || ""} onChange={(event) => setGroupForm({ ...groupForm, description_ar: event.target.value })} />
                </Field>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupForm(null)}>{t("cancel", { defaultMessage: "Cancel" })}</Button>
            <Button className="bg-violet-600 hover:bg-violet-700" disabled={saving || !groupForm?.title_en} onClick={saveGroup}>{t("save", { defaultMessage: "Save" })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(featureForm)} onOpenChange={(open) => !open && setFeatureForm(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{featureForm?.id ? t("edit_feature", { defaultMessage: "Edit feature" }) : t("new_feature", { defaultMessage: "New feature" })}</DialogTitle>
            <DialogDescription>
              {t("feature_form_desc", { defaultMessage: "Inactive features are hidden from plans and locked for every company." })}
            </DialogDescription>
          </DialogHeader>
          {featureForm && (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label={t("name_en", { defaultMessage: "English name" })}>
                <Input value={featureForm.label_en} onChange={(event) => setFeatureForm({ ...featureForm, label_en: event.target.value })} />
              </Field>
              <Field label={t("name_ar", { defaultMessage: "Arabic name" })}>
                <Input dir="rtl" value={featureForm.label_ar || ""} onChange={(event) => setFeatureForm({ ...featureForm, label_ar: event.target.value })} />
              </Field>
              <Field label={t("feature_key", { defaultMessage: "Key" })} hint={featureForm.id ? t("feature_key_locked", { defaultMessage: "Keys cannot be changed." }) : t("feature_key_hint", { defaultMessage: "Lowercase letters, numbers and dashes. Generated from the name if empty." })}>
                <Input disabled={Boolean(featureForm.id)} value={featureForm.key} placeholder={toKey(featureForm.label_en)} onChange={(event) => setFeatureForm({ ...featureForm, key: toKey(event.target.value) })} />
              </Field>
              <Field label={t("feature_group", { defaultMessage: "Group" })}>
                <Select value={featureForm.plan_feature_group_id} onValueChange={(value) => setFeatureForm({ ...featureForm, plan_feature_group_id: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => <SelectItem key={group.id} value={group.id}>{group.title_en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="md:col-span-2">
                <Field label={t("description_en", { defaultMessage: "English description" })}>
                  <Textarea rows={2} value={featureForm.description_en || ""} onChange={(event) => setFeatureForm({ ...featureForm, description_en: event.target.value })} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label={t("description_ar", { defaultMessage: "Arabic description" })}>
                  <Textarea dir="rtl" rows={2} value={featureForm.description_ar || ""} onChange={(event) => setFeatureForm({ ...featureForm, description_ar: event.target.value })} />
                </Field>
              </div>
              <Field label={t("feature_href", { defaultMessage: "Dashboard link" })} hint={t("feature_href_hint", { defaultMessage: "Page opened from the dashboard module card, e.g. /work-orders" })}>
                <Input value={featureForm.href} placeholder="/work-orders" onChange={(event) => setFeatureForm({ ...featureForm, href: event.target.value })} />
              </Field>
              <Field label={t("sort_order", { defaultMessage: "Sort order" })}>
                <Input inputMode="numeric" value={featureForm.sort_order} onChange={(event) => setFeatureForm({ ...featureForm, sort_order: event.target.value })} />
              </Field>
              <Field label={t("feature_api_paths", { defaultMessage: "Locked API paths" })} hint={t("feature_api_paths_hint", { defaultMessage: "One per line, without /api/v1. Use {id} for a record id, e.g. work-orders/{id}/check-in" })}>
                <Textarea rows={4} className="font-mono text-xs" value={featureForm.api_paths} onChange={(event) => setFeatureForm({ ...featureForm, api_paths: event.target.value })} />
              </Field>
              <Field label={t("feature_web_paths", { defaultMessage: "Locked web pages" })} hint={t("feature_web_paths_hint", { defaultMessage: "One per line, e.g. /work-orders. Sub-pages are included." })}>
                <Textarea rows={4} className="font-mono text-xs" value={featureForm.web_paths} onChange={(event) => setFeatureForm({ ...featureForm, web_paths: event.target.value })} />
              </Field>
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3 dark:border-white/10 md:col-span-2">
                <span className="text-sm font-medium">{t("active", { defaultMessage: "Active" })}</span>
                <Switch checked={featureForm.is_active} onCheckedChange={(checked) => setFeatureForm({ ...featureForm, is_active: checked })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeatureForm(null)}>{t("cancel", { defaultMessage: "Cancel" })}</Button>
            <Button className="bg-violet-600 hover:bg-violet-700" disabled={saving || !featureForm?.label_en || !featureForm?.plan_feature_group_id} onClick={saveFeature}>
              {t("save", { defaultMessage: "Save" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
