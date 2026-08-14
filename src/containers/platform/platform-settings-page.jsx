"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Building2,
  Globe2,
  Loader2,
  Radio,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Timer,
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
import EmptyState from "@/components/pmms/empty-state";
import { platformApi } from "@/services/platform/platform-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";

const GROUP_ICONS = {
  building: Building2,
  globe: Globe2,
  timer: Timer,
  radio: Radio,
  shield: ShieldCheck,
};

function flattenValues(groups) {
  const values = {};
  for (const group of groups) {
    for (const setting of group.settings || []) {
      values[setting.key] = setting.type === "integer" ? String(setting.value ?? "") : setting.value;
    }
  }
  return values;
}

function toPayload(groups, values) {
  const payload = {};
  for (const group of groups) {
    for (const setting of group.settings || []) {
      const raw = values[setting.key];
      if (setting.type === "integer") payload[setting.key] = raw === "" || raw == null ? null : Number(raw);
      else if (setting.type === "boolean") payload[setting.key] = Boolean(raw);
      else payload[setting.key] = raw ?? "";
    }
  }
  return payload;
}

function SettingControl({ setting, control }) {
  if (setting.type === "boolean") {
    return (
      <Controller
        name={setting.key}
        control={control}
        render={({ field }) => (
          <Switch
            id={setting.key}
            checked={Boolean(field.value)}
            onCheckedChange={field.onChange}
          />
        )}
      />
    );
  }

  if (setting.type === "select") {
    return (
      <Controller
        name={setting.key}
        control={control}
        rules={{ required: true }}
        render={({ field }) => (
          <Select value={field.value ?? ""} onValueChange={field.onChange}>
            <SelectTrigger id={setting.key} className="h-10 w-full min-w-[220px] rounded-xl bg-white/70 dark:bg-white/5">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {(setting.options || []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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
      name={setting.key}
      control={control}
      rules={{ required: setting.type === "integer" }}
      render={({ field, fieldState }) => (
        <div className="flex min-w-[180px] items-center gap-2">
          <Input
            id={setting.key}
            type="text"
            inputMode={setting.type === "integer" ? "numeric" : "text"}
            className={cn(
              "h-10 rounded-xl bg-white/70 dark:bg-white/5",
              fieldState.error && "border-red-400"
            )}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
          {setting.unit && (
            <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
              {setting.unit}
            </span>
          )}
        </div>
      )}
    />
  );
}

export default function PlatformSettingsPage() {
  const t = useT("common");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState("general");
  const { control, handleSubmit, reset, formState } = useForm();

  const load = async () => {
    try {
      const data = await platformApi.settings();
      const nextGroups = Array.isArray(data?.groups) ? data.groups : [];
      setGroups(nextGroups);
      reset(flattenValues(nextGroups));
      if (nextGroups[0]?.id) setActiveGroup(nextGroups[0].id);
    } catch (error) {
      toast.error(apiError(error, t("settings_load_failed", { defaultMessage: "Failed to load settings" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visibleGroup = useMemo(
    () => groups.find((group) => group.id === activeGroup) || groups[0],
    [groups, activeGroup]
  );

  const onSave = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const data = await platformApi.updateSettings({ values: toPayload(groups, values) });
      const nextGroups = Array.isArray(data?.groups) ? data.groups : groups;
      setGroups(nextGroups);
      reset(flattenValues(nextGroups));
      toast.success(t("settings_saved", { defaultMessage: "Settings saved" }));
    } catch (error) {
      toast.error(apiError(error, t("settings_save_failed", { defaultMessage: "Unable to save settings" })));
    } finally {
      setSaving(false);
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SlidersHorizontal}
        title={t("platform_settings_title", { defaultMessage: "Platform settings" })}
        description={t("platform_settings_desc", {
          defaultMessage: "Backend-defined defaults for every company. Edit values here — keys are not created from this screen.",
        })}
        actions={
          <div className="flex items-center gap-2">
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

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="glass-panel h-64 animate-pulse rounded-2xl" />
          <div className="glass-panel h-96 animate-pulse rounded-2xl" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title={t("no_settings", { defaultMessage: "No settings" })}
          description={t("no_settings_desc", { defaultMessage: "The backend catalog has not published any settings yet." })}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav className="glass-panel h-fit space-y-1 rounded-2xl p-2 lg:sticky lg:top-24">
            {groups.map((group) => {
              const Icon = GROUP_ICONS[group.icon] || SlidersHorizontal;
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
                  <span className="font-medium">{group.title}</span>
                </button>
              );
            })}
          </nav>

          {visibleGroup && (
            <section className="glass-panel overflow-hidden rounded-2xl">
              <div className="border-b border-slate-200/70 px-5 py-5 dark:border-white/10 md:px-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                  {visibleGroup.title}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {visibleGroup.description}
                </h2>
              </div>

              <div>
                {visibleGroup.settings.map((setting) => (
                  <div
                    key={setting.key}
                    className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-5 last:border-0 dark:border-white/10 md:flex-row md:items-center md:justify-between md:px-6"
                  >
                    <div className="min-w-0 md:max-w-[58%]">
                      <label htmlFor={setting.key} className="text-sm font-semibold text-slate-900 dark:text-white">
                        {setting.label}
                      </label>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        {setting.description}
                      </p>
                      {setting.min != null && setting.max != null && (
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                          {t("allowed_range", { defaultMessage: "Allowed range" })}: {setting.min}–{setting.max}
                          {setting.unit ? ` ${setting.unit}` : ""}
                        </p>
                      )}
                    </div>
                    <div className={cn("shrink-0", setting.type === "boolean" ? "" : "w-full md:w-[280px]")}>
                      <SettingControl setting={setting} control={control} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
