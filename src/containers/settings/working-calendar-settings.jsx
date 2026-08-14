"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { CalendarDays, Clock3, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/pmms/page-header";
import { settingsApi } from "@/services/settings/settings-api";
import { apiError, formatDay } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { cn } from "@/lib/utils";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const TIMEZONES = ["Asia/Qatar", "Asia/Riyadh", "Asia/Dubai", "Asia/Kuwait", "Asia/Bahrain", "Asia/Muscat", "UTC"];
const SLOT_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240];

const DEFAULTS = {
  name: "Platform Calendar",
  timezone: "Asia/Qatar",
  slot_start: "08:00",
  slot_end: "17:00",
  slot_minutes: 60,
  weekdays: [0, 1, 2, 3, 4],
};

function toTimeInput(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function toApiTime(value) {
  if (!value) return "";
  return String(value).length === 5 ? `${value}:00` : value;
}

function normalizeWeekdays(value) {
  return (Array.isArray(value) ? value : []).map((day) => Number(day)).filter((day) => day >= 0 && day <= 6);
}

export default function WorkingCalendarSettings() {
  const t = useT("common");
  const canEdit = normalizeRole(useSession().data?.user?.role) === Roles.SUPER_ADMIN;
  const [holidays, setHolidays] = useState([]);
  const [holiday, setHoliday] = useState({ date: "", name: "", name_ar: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const { control, handleSubmit, reset, watch, setValue, formState } = useForm({ defaultValues: DEFAULTS });
  const weekdays = normalizeWeekdays(watch("weekdays"));
  const slotStart = watch("slot_start");
  const slotEnd = watch("slot_end");
  const timezone = watch("timezone");
  const slotMinutes = watch("slot_minutes");

  const load = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.calendar();
      setHolidays(Array.isArray(data?.holidays) ? data.holidays : []);
      reset({
        name: data?.name || DEFAULTS.name,
        timezone: data?.timezone || DEFAULTS.timezone,
        slot_start: toTimeInput(data?.slot_start) || DEFAULTS.slot_start,
        slot_end: toTimeInput(data?.slot_end) || DEFAULTS.slot_end,
        slot_minutes: Number(data?.slot_minutes || DEFAULTS.slot_minutes),
        weekdays: normalizeWeekdays(data?.weekdays).length ? normalizeWeekdays(data.weekdays) : DEFAULTS.weekdays,
      });
    } catch (error) {
      toast.error(apiError(error, t("calendar_load_failed", { defaultMessage: "Failed to load calendar" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleDay = (index) => {
    if (!canEdit) return;
    const next = weekdays.includes(index)
      ? weekdays.filter((day) => day !== index)
      : [...weekdays, index].sort((a, b) => a - b);
    setValue("weekdays", next, { shouldDirty: true });
  };

  const summary = useMemo(() => {
    const days = weekdays.map((day) => t(`cal_day_${DAY_KEYS[day]}`, { defaultMessage: DAY_KEYS[day] })).join(", ");
    return t("cal_summary", {
      defaultMessage: "{start}–{end} · {minutes} min slots · {days} · {zone}",
      start: slotStart || "—",
      end: slotEnd || "—",
      minutes: slotMinutes || "—",
      days: days || t("cal_no_days", { defaultMessage: "no working days" }),
      zone: timezone || "—",
    });
  }, [weekdays, slotStart, slotEnd, slotMinutes, timezone, t]);

  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))),
    [holidays]
  );

  const onSave = handleSubmit(async (values) => {
    if (!normalizeWeekdays(values.weekdays).length) {
      toast.error(t("cal_days_required", { defaultMessage: "Select at least one working day" }));
      return;
    }
    setSaving(true);
    try {
      const data = await settingsApi.updateCalendar({
        name: values.name,
        timezone: values.timezone,
        weekdays: normalizeWeekdays(values.weekdays),
        slot_start: toApiTime(values.slot_start),
        slot_end: toApiTime(values.slot_end),
        slot_minutes: Number(values.slot_minutes),
      });
      setHolidays(Array.isArray(data?.holidays) ? data.holidays : holidays);
      reset({
        ...values,
        slot_start: toTimeInput(data?.slot_start) || values.slot_start,
        slot_end: toTimeInput(data?.slot_end) || values.slot_end,
        weekdays: normalizeWeekdays(data?.weekdays).length ? normalizeWeekdays(data.weekdays) : values.weekdays,
      });
      toast.success(t("calendar_updated", { defaultMessage: "Calendar updated" }));
    } catch (error) {
      toast.error(apiError(error, t("calendar_save_failed", { defaultMessage: "Unable to update calendar" })));
    } finally {
      setSaving(false);
    }
  });

  const addHoliday = async () => {
    if (!holiday.date || !holiday.name.trim()) {
      toast.error(t("cal_holiday_required", { defaultMessage: "Date and English name are required" }));
      return;
    }
    setAdding(true);
    try {
      await settingsApi.addHoliday({
        date: holiday.date,
        name: holiday.name.trim(),
        name_ar: holiday.name_ar.trim() || holiday.name.trim(),
      });
      setHoliday({ date: "", name: "", name_ar: "" });
      toast.success(t("holiday_added", { defaultMessage: "Holiday added" }));
      const data = await settingsApi.calendar();
      setHolidays(Array.isArray(data?.holidays) ? data.holidays : []);
    } catch (error) {
      toast.error(apiError(error, t("holiday_add_failed", { defaultMessage: "Unable to add holiday" })));
    } finally {
      setAdding(false);
    }
  };

  const removeHoliday = async (id) => {
    try {
      await settingsApi.deleteHoliday(id);
      setHolidays((current) => current.filter((item) => item.id !== id));
      toast.success(t("holiday_removed", { defaultMessage: "Holiday removed" }));
    } catch (error) {
      toast.error(apiError(error, t("holiday_remove_failed", { defaultMessage: "Unable to remove holiday" })));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-panel h-24 animate-pulse rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-72 animate-pulse rounded-2xl bg-white/60 dark:bg-slate-900/40" />
          <div className="h-72 animate-pulse rounded-2xl bg-white/60 dark:bg-slate-900/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarDays}
        title={t("calendar_title", { defaultMessage: "Working calendar" })}
        description={t("calendar_desc", { defaultMessage: "Working days, slot length, and holidays used for complaint booking." })}
        actions={
          canEdit ? (
            <div className="flex flex-wrap items-center gap-2">
              {formState.isDirty && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                  {t("unsaved_changes", { defaultMessage: "Unsaved changes" })}
                </span>
              )}
              <Button
                className="rounded-full bg-violet-600 hover:bg-violet-700"
                onClick={onSave}
                disabled={saving || !formState.isDirty}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {t("save_changes", { defaultMessage: "Save changes" })}
              </Button>
            </div>
          ) : null
        }
      />

      <div className="glass-panel flex items-start gap-3 rounded-2xl px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
          <Clock3 className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
            {t("cal_booking_window", { defaultMessage: "Booking window" })}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{summary}</p>
          {!canEdit && (
            <p className="mt-1 text-xs text-slate-400">
              {t("cal_readonly", { defaultMessage: "Only a Super Admin can change the platform calendar." })}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass-panel overflow-hidden rounded-2xl">
          <div className="border-b border-slate-200/70 px-5 py-5 dark:border-white/10 md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
              {t("cal_hours_label", { defaultMessage: "Hours" })}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {t("cal_hours_title", { defaultMessage: "Name, timezone, and slot length" })}
            </h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
            <Controller
              name="name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("name", { defaultMessage: "Name" })}</span>
                  <Input className="h-10 rounded-xl bg-white/70 dark:bg-white/5" disabled={!canEdit} {...field} />
                </label>
              )}
            />
            <Controller
              name="timezone"
              control={control}
              render={({ field }) => (
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("timezone", { defaultMessage: "Timezone" })}</span>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!canEdit}>
                    <SelectTrigger className="h-10 rounded-xl bg-white/70 dark:bg-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.includes(field.value) ? null : field.value ? (
                        <SelectItem value={field.value}>{field.value}</SelectItem>
                      ) : null}
                      {TIMEZONES.map((zone) => (
                        <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              )}
            />
            <Controller
              name="slot_minutes"
              control={control}
              render={({ field }) => (
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("cal_slot_minutes", { defaultMessage: "Slot length" })}</span>
                  <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))} disabled={!canEdit}>
                    <SelectTrigger className="h-10 rounded-xl bg-white/70 dark:bg-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOT_OPTIONS.includes(Number(field.value)) ? null : (
                        <SelectItem value={String(field.value)}>{field.value} {t("cal_minutes", { defaultMessage: "min" })}</SelectItem>
                      )}
                      {SLOT_OPTIONS.map((minutes) => (
                        <SelectItem key={minutes} value={String(minutes)}>
                          {minutes} {t("cal_minutes", { defaultMessage: "min" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              )}
            />
            <Controller
              name="slot_start"
              control={control}
              render={({ field }) => (
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("cal_slot_start", { defaultMessage: "Slot start" })}</span>
                  <Input type="time" className="h-10 rounded-xl bg-white/70 dark:bg-white/5" disabled={!canEdit} {...field} />
                </label>
              )}
            />
            <Controller
              name="slot_end"
              control={control}
              render={({ field }) => (
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("cal_slot_end", { defaultMessage: "Slot end" })}</span>
                  <Input type="time" className="h-10 rounded-xl bg-white/70 dark:bg-white/5" disabled={!canEdit} {...field} />
                </label>
              )}
            />
            <p className="text-xs text-slate-400 md:col-span-2">
              {t("cal_hours_hint", { defaultMessage: "Complaint booking slots are generated between these hours on working days." })}
            </p>
          </div>
        </section>

        <section className="glass-panel overflow-hidden rounded-2xl">
          <div className="border-b border-slate-200/70 px-5 py-5 dark:border-white/10 md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
              {t("cal_days_label", { defaultMessage: "Working days" })}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {t("cal_days_title", { defaultMessage: "Days tenants can book a slot" })}
            </h2>
          </div>
          <div className="p-5 md:p-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DAY_KEYS.map((key, index) => {
                const active = weekdays.includes(index);
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => toggleDay(index)}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left transition",
                      active
                        ? "border-violet-300 bg-violet-600 text-white shadow-sm"
                        : "border-slate-200/80 bg-white/60 text-slate-600 hover:border-violet-200 hover:bg-violet-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
                      !canEdit && "cursor-default opacity-80"
                    )}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                      {t(`cal_day_${key}`, { defaultMessage: key })}
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {active ? t("working", { defaultMessage: "Working" }) : t("off", { defaultMessage: "Off" })}
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              {t("cal_days_hint", { defaultMessage: "Qatar default is Sunday–Thursday. Friday and Saturday stay off unless you enable them." })}
            </p>
          </div>
        </section>
      </div>

      <section className="glass-panel overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-5 dark:border-white/10 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
              {t("holidays", { defaultMessage: "Holidays" })}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
              {t("cal_holidays_title", { defaultMessage: "Closed dates are skipped when booking" })}
            </h2>
          </div>
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
            {t("cal_holiday_count", { defaultMessage: "{count} holidays", count: sortedHolidays.length })}
          </span>
        </div>

        {canEdit && (
          <div className="grid gap-3 border-b border-slate-200/70 px-5 py-5 dark:border-white/10 md:grid-cols-[160px_1fr_1fr_auto] md:px-6">
            <Input
              type="date"
              className="h-10 rounded-xl bg-white/70 dark:bg-white/5"
              value={holiday.date}
              onChange={(event) => setHoliday((current) => ({ ...current, date: event.target.value }))}
            />
            <Input
              className="h-10 rounded-xl bg-white/70 dark:bg-white/5"
              placeholder={t("cal_holiday_name", { defaultMessage: "Holiday name" })}
              value={holiday.name}
              onChange={(event) => setHoliday((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              className="h-10 rounded-xl bg-white/70 dark:bg-white/5"
              placeholder={t("cal_holiday_name_ar", { defaultMessage: "Arabic name" })}
              value={holiday.name_ar}
              onChange={(event) => setHoliday((current) => ({ ...current, name_ar: event.target.value }))}
            />
            <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={addHoliday} disabled={adding}>
              {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {t("add_holiday", { defaultMessage: "Add holiday" })}
            </Button>
          </div>
        )}

        {sortedHolidays.length === 0 ? (
          <div className="px-5 py-12 text-center md:px-6">
            <CalendarDays className="mx-auto mb-3 h-8 w-8 text-violet-500" />
            <p className="font-semibold text-slate-800 dark:text-white">{t("cal_no_holidays", { defaultMessage: "No holidays yet" })}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {t("cal_no_holidays_desc", { defaultMessage: "National and company closed days will be skipped in complaint slot booking." })}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-slate-200/70 text-left text-[11px] uppercase tracking-wider text-slate-400 dark:border-white/10">
                  <th className="px-5 py-3 font-semibold md:px-6">{t("date", { defaultMessage: "Date" })}</th>
                  <th className="px-5 py-3 font-semibold md:px-6">{t("name", { defaultMessage: "Name" })}</th>
                  <th className="px-5 py-3 font-semibold md:px-6">{t("name_ar", { defaultMessage: "Arabic name" })}</th>
                  {canEdit && <th className="px-5 py-3 text-right font-semibold md:px-6">{t("actions", { defaultMessage: "Actions" })}</th>}
                </tr>
              </thead>
              <tbody>
                {sortedHolidays.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                    <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100 md:px-6">{formatDay(item.date)}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 md:px-6">{item.name}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 md:px-6">{item.name_ar || "—"}</td>
                    {canEdit && (
                      <td className="px-5 py-3 text-right md:px-6">
                        <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700" onClick={() => removeHoliday(item.id)}>
                          <Trash2 className="mr-1 h-4 w-4" />
                          {t("remove", { defaultMessage: "Remove" })}
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
