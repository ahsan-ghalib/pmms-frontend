"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Camera,
  ClipboardList,
  Loader2,
  MapPin,
  MessageSquareWarning,
  Package,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/pmms/page-header";
import { settingsApi } from "@/services/settings/settings-api";
import { companiesApi } from "@/services/companies/companies-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { cn } from "@/lib/utils";

const DEFAULTS = {
  duplicate_complaint_rule: "warn",
  work_order_reopen_enabled: true,
  force_assignment: false,
  max_hold_count: "",
  require_before_photos: true,
  require_after_photos: true,
  require_parts_on_complete: false,
  require_gps_checkout: true,
  sla_pauses_on_hold: true,
  rating_window_hours: 72,
  allow_close_without_verify: false,
  tracking_interval_seconds: 45,
  allow_negative_stock: false,
  require_asset_scan_to_start: false,
  require_gps_checkin: false,
};

const GROUPS = [
  { id: "intake", icon: MessageSquareWarning, keys: ["duplicate_complaint_rule"] },
  { id: "lifecycle", icon: ClipboardList, keys: ["work_order_reopen_enabled", "force_assignment", "max_hold_count", "sla_pauses_on_hold", "allow_close_without_verify", "rating_window_hours"] },
  { id: "evidence", icon: Camera, keys: ["require_before_photos", "require_after_photos", "require_parts_on_complete"] },
  { id: "field", icon: MapPin, keys: ["require_gps_checkin", "require_gps_checkout", "require_asset_scan_to_start", "tracking_interval_seconds"] },
  { id: "stock", icon: Package, keys: ["allow_negative_stock"] },
];

const SETTINGS = {
  duplicate_complaint_rule: { type: "select", options: ["allow", "warn", "block"] },
  max_hold_count: { type: "integer", min: 1, unit: "holds", optional: true },
  rating_window_hours: { type: "integer", min: 1, unit: "hours" },
  tracking_interval_seconds: { type: "integer", min: 30, max: 60, unit: "sec" },
  work_order_reopen_enabled: { type: "boolean" },
  force_assignment: { type: "boolean" },
  require_before_photos: { type: "boolean" },
  require_after_photos: { type: "boolean" },
  require_parts_on_complete: { type: "boolean" },
  require_gps_checkout: { type: "boolean" },
  sla_pauses_on_hold: { type: "boolean" },
  allow_close_without_verify: { type: "boolean" },
  allow_negative_stock: { type: "boolean" },
  require_asset_scan_to_start: { type: "boolean" },
  require_gps_checkin: { type: "boolean" },
};

function toFormValues(data = {}) {
  return {
    ...DEFAULTS,
    ...data,
    max_hold_count: data.max_hold_count ?? "",
    rating_window_hours: data.rating_window_hours ?? 72,
    tracking_interval_seconds: data.tracking_interval_seconds ?? 45,
  };
}

function SettingControl({ settingKey, meta, control, t }) {
  if (meta.type === "boolean") {
    return (
      <Controller
        name={settingKey}
        control={control}
        render={({ field }) => (
          <Switch id={settingKey} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
        )}
      />
    );
  }

  if (meta.type === "select") {
    return (
      <Controller
        name={settingKey}
        control={control}
        rules={{ required: true }}
        render={({ field }) => (
          <Select value={field.value ?? ""} onValueChange={field.onChange}>
            <SelectTrigger id={settingKey} className="h-10 w-full min-w-[220px] rounded-xl bg-white/70 dark:bg-white/5">
              <SelectValue placeholder={t("select", { defaultMessage: "Select" })} />
            </SelectTrigger>
            <SelectContent>
              {meta.options.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`wo_opt_${value}`, { defaultMessage: value })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    );
  }

  return (
    <Controller
      name={settingKey}
      control={control}
      render={({ field, fieldState }) => (
        <div className="flex min-w-[180px] items-center gap-2">
          <Input
            id={settingKey}
            type="text"
            inputMode="numeric"
            className={cn("h-10 rounded-xl bg-white/70 dark:bg-white/5", fieldState.error && "border-red-400")}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={meta.optional ? t("unlimited", { defaultMessage: "Unlimited" }) : ""}
          />
          {meta.unit ? (
            <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
              {t(`wo_unit_${meta.unit}`, { defaultMessage: meta.unit })}
            </span>
          ) : null}
        </div>
      )}
    />
  );
}

export default function ComplaintSettingsForm() {
  const t = useT("common");
  const role = normalizeRole(useSession().data?.user?.role);
  const isSuper = role === Roles.SUPER_ADMIN;
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState("intake");
  const { control, handleSubmit, reset, formState } = useForm({ defaultValues: DEFAULTS });

  const visibleGroup = useMemo(
    () => GROUPS.find((group) => group.id === activeGroup) || GROUPS[0],
    [activeGroup]
  );

  const loadSettings = async (nextCompanyId) => {
    setLoading(true);
    try {
      const data = await settingsApi.complaintSettings(nextCompanyId ? { company_id: nextCompanyId } : {});
      reset(toFormValues(data));
      if (data?.company_id) setCompanyId(data.company_id);
    } catch (error) {
      toast.error(apiError(error, t("settings_load_failed", { defaultMessage: "Failed to load settings" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      if (isSuper) {
        try {
          const rows = await companiesApi.list();
          const list = Array.isArray(rows) ? rows.filter((row) => !row.archived_at) : [];
          setCompanies(list);
          const first = list[0]?.id;
          if (first) {
            setCompanyId(first);
            await loadSettings(first);
            return;
          }
        } catch (error) {
          toast.error(apiError(error, t("companies_load_failed", { defaultMessage: "Failed to load companies" })));
        }
        setLoading(false);
        return;
      }
      await loadSettings();
    };
    boot();
  }, [isSuper]);

  const onSave = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const data = await settingsApi.updateComplaintSettings({
        ...values,
        company_id: companyId || undefined,
        max_hold_count: values.max_hold_count === "" || values.max_hold_count == null ? null : Number(values.max_hold_count),
        tracking_interval_seconds: Number(values.tracking_interval_seconds || 45),
        rating_window_hours: Number(values.rating_window_hours || 72),
      });
      reset(toFormValues(data));
      toast.success(t("settings_saved", { defaultMessage: "Settings saved" }));
    } catch (error) {
      toast.error(apiError(error, t("settings_save_failed", { defaultMessage: "Unable to save settings" })));
    } finally {
      setSaving(false);
    }
  });

  const selectedCompany = companies.find((row) => row.id === companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SlidersHorizontal}
        title={t("wo_settings_title", { defaultMessage: "Complaint & work order settings" })}
        description={t("wo_settings_desc", { defaultMessage: "Company policy for duplicates, holds, evidence, and closure." })}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {formState.isDirty && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                {t("unsaved_changes", { defaultMessage: "Unsaved changes" })}
              </span>
            )}
            <Button
              className="rounded-full bg-violet-600 hover:bg-violet-700"
              onClick={onSave}
              disabled={saving || loading || !formState.isDirty}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t("save_changes", { defaultMessage: "Save changes" })}
            </Button>
          </div>
        }
      />

      {isSuper && (
        <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {t("wo_company_scope", { defaultMessage: "Company policy" })}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("wo_company_scope_desc", { defaultMessage: "These rules apply to one company at a time." })}
            </p>
          </div>
          <Select
            value={companyId}
            onValueChange={(value) => {
              setCompanyId(value);
              loadSettings(value);
            }}
          >
            <SelectTrigger className="h-10 w-full rounded-xl bg-white/70 dark:bg-white/5 md:w-[320px]">
              <SelectValue placeholder={t("company", { defaultMessage: "Company" })} />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="glass-panel h-64 animate-pulse rounded-2xl" />
          <div className="glass-panel h-96 animate-pulse rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav className="glass-panel h-fit space-y-1 rounded-2xl p-2 lg:sticky lg:top-24">
            {GROUPS.map((group) => {
              const Icon = group.icon;
              const active = visibleGroup?.id === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setActiveGroup(group.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                    active
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-violet-50 dark:text-slate-300 dark:hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{t(`wo_group_${group.id}`, { defaultMessage: group.id })}</span>
                </button>
              );
            })}
          </nav>

          <section className="glass-panel overflow-hidden rounded-2xl">
            <div className="border-b border-slate-200/70 px-5 py-5 dark:border-white/10 md:px-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                {t(`wo_group_${visibleGroup.id}`, { defaultMessage: visibleGroup.id })}
                {selectedCompany ? ` · ${selectedCompany.name}` : ""}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                {t(`wo_group_${visibleGroup.id}_desc`, { defaultMessage: "" })}
              </h2>
            </div>

            <div>
              {visibleGroup.keys.map((key) => {
                const meta = SETTINGS[key];
                return (
                  <div
                    key={key}
                    className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-5 last:border-0 dark:border-white/10 md:flex-row md:items-center md:justify-between md:px-6"
                  >
                    <div className="min-w-0 md:max-w-[58%]">
                      <label htmlFor={key} className="text-sm font-semibold text-slate-900 dark:text-white">
                        {t(`wo_${key}`, { defaultMessage: key })}
                      </label>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        {t(`wo_${key}_desc`, { defaultMessage: "" })}
                      </p>
                      {meta.min != null && meta.max != null && (
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                          {t("allowed_range", { defaultMessage: "Allowed range" })}: {meta.min}–{meta.max}
                          {meta.unit ? ` ${t(`wo_unit_${meta.unit}`, { defaultMessage: meta.unit })}` : ""}
                        </p>
                      )}
                    </div>
                    <div className={cn("shrink-0", meta.type === "boolean" ? "" : "w-full md:w-[280px]")}>
                      <SettingControl settingKey={key} meta={meta} control={control} t={t} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
