"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarClock,
  CalendarPlus,
  Clock3,
  History,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/common/data-table";
import TableToolbar from "@/components/common/table-toolbar";
import StatCard from "@/components/common/stat-card";
import PageHeader from "@/components/pmms/page-header";
import EmptyState from "@/components/pmms/empty-state";
import { StatusBadge } from "@/components/pmms/status-badge";
import { SelectField } from "@/components/form-fields";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { maintenanceApi } from "@/services/settings/settings-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { assetsApi } from "@/services/assets/assets-api";
import { apiError, formatDay, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useLocaleContext } from "@/providers/locale-provider";
import { useSession } from "next-auth/react";
import { isAdmin, isManager } from "@/lib/permissions/role-access";
import { cn } from "@/lib/utils";

const FREQUENCIES = [
  { value: "monthly", key: "freq_monthly" },
  { value: "3_months", key: "freq_3_months" },
  { value: "6_months", key: "freq_6_months" },
  { value: "yearly", key: "freq_yearly" },
];

const FREQ_STYLES = {
  monthly: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200",
  "3_months": "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200",
  "6_months": "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200",
  yearly: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200",
};

function startOfDay(value) {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function dueMeta(dateStr) {
  if (!dateStr) return { kind: "none", days: null };
  const due = startOfDay(`${String(dateStr).slice(0, 10)}T00:00:00`);
  const today = startOfDay();
  const days = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { kind: "overdue", days };
  if (days === 0) return { kind: "today", days };
  if (days <= 7) return { kind: "soon", days };
  return { kind: "ok", days };
}

function localizedName(item, locale) {
  if (!item) return "—";
  if (locale === "ar") return item.name_ar || item.name_en || item.name || "—";
  return item.name_en || item.name_ar || item.name || "—";
}

export default function MaintenanceSchedules() {
  const t = useT("common");
  const router = useRouter();
  const { locale } = useLocaleContext();
  const role = useSession().data?.user?.role;
  const canManage = isManager(role);
  const canGenerate = isAdmin(role);

  const [rows, setRows] = useState([]);
  const [properties, setProperties] = useState([]);
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyTitle, setHistoryTitle] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: { property_id: "", asset_id: "", category_id: "", service_id: "", frequency: "monthly", next_due_date: "" },
  });
  const categoryId = watch("category_id");
  const propertyId = watch("property_id");
  const services = categories.find((category) => category.id === categoryId)?.services || [];

  const load = async () => {
    setLoading(true);
    try {
      const data = await maintenanceApi.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("pm_load_failed", { defaultMessage: "Failed to load schedules" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    propertiesApi.list().then((data) => setProperties(Array.isArray(data) ? data : [])).catch(() => {});
    complaintsApi.categories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!propertyId) {
      setAssets([]);
      return;
    }
    assetsApi.list({ property_id: propertyId }).then((data) => setAssets(Array.isArray(data) ? data.filter((row) => row.status !== "disposed") : [])).catch(() => setAssets([]));
  }, [propertyId]);

  const freqLabel = (value) => {
    const match = FREQUENCIES.find((item) => item.value === value);
    return match ? t(match.key, { defaultMessage: labelize(value) }) : labelize(value);
  };

  const stats = useMemo(() => {
    const active = rows.filter((row) => row.is_active);
    return {
      total: rows.length,
      active: active.length,
      soon: active.filter((row) => ["soon", "today"].includes(dueMeta(row.next_due_date).kind)).length,
      overdue: active.filter((row) => dueMeta(row.next_due_date).kind === "overdue").length,
      monthly: active.filter((row) => row.frequency === "monthly").length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const due = dueMeta(row.next_due_date);
      if (filter === "active" && !row.is_active) return false;
      if (filter === "inactive" && row.is_active) return false;
      if (filter === "soon" && !["soon", "today"].includes(due.kind)) return false;
      if (filter === "overdue" && due.kind !== "overdue") return false;
      if (["monthly", "3_months", "6_months", "yearly"].includes(filter) && row.frequency !== filter) return false;
      if (!query) return true;
      const haystack = [
        row.property?.name,
        row.property?.code,
        localizedName(row.category, locale),
        localizedName(row.service, locale),
        row.frequency,
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, filter, search, locale]);

  const filters = [
    { id: "all", label: t("all", { defaultMessage: "All" }), count: stats.total },
    { id: "active", label: t("active", { defaultMessage: "Active" }), count: stats.active },
    { id: "soon", label: t("pm_due_soon", { defaultMessage: "Due soon" }), count: stats.soon },
    { id: "overdue", label: t("overdue", { defaultMessage: "Overdue" }), count: stats.overdue },
    { id: "monthly", label: t("freq_monthly", { defaultMessage: "Monthly" }), count: stats.monthly },
    { id: "inactive", label: t("inactive", { defaultMessage: "Inactive" }), count: rows.filter((row) => !row.is_active).length },
  ];

  const openHistory = async (row) => {
    setHistoryTitle(row.property?.name || t("pm_history", { defaultMessage: "Completion history" }));
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const data = await maintenanceApi.history(row.id);
      setHistoryRows(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(apiError(error, t("pm_history_failed", { defaultMessage: "Failed to load history" })));
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const generateDue = async () => {
    setGenerating(true);
    try {
      const result = await maintenanceApi.generate();
      const created = result?.data?.created ?? result?.created ?? 0;
      toast.success(result?.message || t("pm_generated", { defaultMessage: "Due work orders generated", count: created }));
      load();
    } catch (error) {
      toast.error(apiError(error, t("pm_generate_failed", { defaultMessage: "Unable to generate due jobs" })));
    } finally {
      setGenerating(false);
    }
  };

  const columns = [
    {
      accessorKey: "property",
      header: t("property", { defaultMessage: "Property" }),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white">
            {(row.original.property?.name || "?").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{row.original.property?.name || "—"}</p>
            <p className="text-xs text-slate-500">{row.original.asset?.name || row.original.property?.code || t("pm_no_code", { defaultMessage: "No property code" })}</p>
          </div>
        </div>
      ),
    },
    {
      id: "service",
      header: t("service", { defaultMessage: "Service" }),
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{localizedName(row.original.service, locale)}</p>
          <p className="text-xs text-slate-500">{localizedName(row.original.category, locale)}</p>
        </div>
      ),
    },
    {
      accessorKey: "frequency",
      header: t("frequency", { defaultMessage: "Frequency" }),
      cell: ({ row }) => (
        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", FREQ_STYLES[row.original.frequency] || "bg-slate-100 text-slate-700")}>
          {freqLabel(row.original.frequency)}
        </span>
      ),
    },
    {
      accessorKey: "next_due_date",
      header: t("next_due", { defaultMessage: "Next due" }),
      cell: ({ row }) => {
        const due = dueMeta(row.original.next_due_date);
        const tone = {
          overdue: "text-rose-600 dark:text-rose-300",
          today: "text-amber-600 dark:text-amber-300",
          soon: "text-amber-600 dark:text-amber-300",
          ok: "text-slate-700 dark:text-slate-200",
        }[due.kind] || "text-slate-500";
        const hint = {
          overdue: t("pm_days_overdue", { defaultMessage: "{count} days overdue", count: Math.abs(due.days || 0) }),
          today: t("pm_due_today", { defaultMessage: "Due today" }),
          soon: t("pm_days_left", { defaultMessage: "In {count} days", count: due.days }),
          ok: t("pm_days_left", { defaultMessage: "In {count} days", count: due.days }),
        }[due.kind];
        return (
          <div>
            <p className={cn("font-semibold", tone)}>{formatDay(row.original.next_due_date)}</p>
            {hint ? <p className="text-[11px] text-slate-500">{hint}</p> : null}
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: t("status", { defaultMessage: "Status" }),
      cell: ({ row }) => {
        const due = dueMeta(row.original.next_due_date);
        if (row.original.is_active && due.kind === "overdue") return <StatusBadge value="overdue" />;
        return <StatusBadge value={row.original.is_active ? "active" : "inactive"} />;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">{t("actions", { defaultMessage: "Actions" })}</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => openHistory(row.original)}>
            <History className="mr-2 h-3.5 w-3.5" />
            {t("pm_history", { defaultMessage: "History" })}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={CalendarClock}
        title={t("pm_schedules", { defaultMessage: "Preventive Maintenance" })}
        description={t("pm_schedules_desc", { defaultMessage: "Schedules generate work orders automatically on the due date." })}
        actions={
          <>
            {canGenerate && (
              <Button variant="outline" className="rounded-full" disabled={generating} onClick={generateDue}>
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {t("pm_generate", { defaultMessage: "Generate due now" })}
              </Button>
            )}
            {canManage && (
              <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("pm_new_schedule", { defaultMessage: "New schedule" })}
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard title={t("pm_schedules", { defaultMessage: "Schedules" })} value={stats.total} theme="indigo" icon={CalendarClock} onClick={() => setFilter("all")} />
        <StatCard title={t("active", { defaultMessage: "Active" })} value={stats.active} theme="green" icon={CalendarPlus} onClick={() => setFilter("active")} />
        <StatCard title={t("pm_due_soon", { defaultMessage: "Due soon" })} value={stats.soon} hint={t("pm_due_soon_hint", { defaultMessage: "Next 7 days" })} theme="amber" icon={Clock3} onClick={() => setFilter("soon")} />
        <StatCard title={t("overdue", { defaultMessage: "Overdue" })} value={stats.overdue} theme="rose" icon={AlertTriangle} onClick={() => setFilter("overdue")} />
        <StatCard title={t("freq_monthly", { defaultMessage: "Monthly" })} value={stats.monthly} theme="purple" icon={Sparkles} onClick={() => setFilter("monthly")} />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              filter === item.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
            )}
          >
            {item.label} · {item.count}
          </button>
        ))}
      </div>

      <TableToolbar config={{ search: { placeholder: t("pm_search", { defaultMessage: "Search property, service, or frequency..." }), value: search, onChange: setSearch } }} />

      {!loading && rows.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={t("pm_empty", { defaultMessage: "No preventive schedules yet" })}
          description={t("pm_empty_desc", { defaultMessage: "Create a schedule so PMMS can open work orders automatically on the due date." })}
          actionLabel={canManage ? t("pm_new_schedule", { defaultMessage: "New schedule" }) : undefined}
          onAction={canManage ? () => setCreateOpen(true) : undefined}
        />
      ) : (
        <DataTable columns={columns} data={filtered} isLoading={loading} columnsBtn={false} total={filtered.length} />
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) reset();
        }}
      >
        <DialogContent className="glass-panel-strong sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("pm_new_schedule", { defaultMessage: "New schedule" })}</DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("pm_form_desc", { defaultMessage: "Pick a property, service, and the next due date. PMMS will raise a work order when it comes due." })}
            </p>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(async (values) => {
              try {
                await maintenanceApi.create({ ...values, asset_id: values.asset_id || undefined });
                toast.success(t("pm_created", { defaultMessage: "Schedule created" }));
                reset();
                setCreateOpen(false);
                load();
              } catch (error) {
                toast.error(apiError(error, t("pm_create_failed", { defaultMessage: "Unable to create schedule" })));
              }
            })}
            className="grid gap-1 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <SelectField
                label={t("property", { defaultMessage: "Property" })}
                name="property_id"
                control={control}
                errors={errors}
                validation={{ required: t("required", { defaultMessage: "Required" }) }}
                options={properties.map((item) => ({ value: item.id, label: item.name }))}
              />
            </div>
            <div className="sm:col-span-2">
              <SelectField
                label={t("asset", { defaultMessage: "Asset" })}
                name="asset_id"
                control={control}
                errors={errors}
                options={assets.map((item) => ({ value: item.id, label: `${item.asset_code} · ${item.name}` }))}
              />
            </div>
            <SelectField
              label={t("category", { defaultMessage: "Category" })}
              name="category_id"
              control={control}
              errors={errors}
              validation={{ required: t("required", { defaultMessage: "Required" }) }}
              options={categories.map((item) => ({ value: item.id, label: localizedName(item, locale) }))}
              onValueChange={() => setValue("service_id", "")}
            />
            <SelectField
              label={t("service", { defaultMessage: "Service" })}
              name="service_id"
              control={control}
              errors={errors}
              validation={{ required: t("required", { defaultMessage: "Required" }) }}
              options={services.map((item) => ({ value: item.id, label: localizedName(item, locale) }))}
            />
            <SelectField
              label={t("frequency", { defaultMessage: "Frequency" })}
              name="frequency"
              control={control}
              errors={errors}
              options={FREQUENCIES.map((item) => ({ value: item.value, label: t(item.key, { defaultMessage: labelize(item.value) }) }))}
            />
            <div className="mb-4">
              <Label className="mb-2" htmlFor="next_due_date">
                {t("next_due", { defaultMessage: "Next due" })}
                <span className="ml-1 text-red-500">*</span>
              </Label>
              <Controller
                name="next_due_date"
                control={control}
                rules={{ required: t("required", { defaultMessage: "Required" }) }}
                render={({ field }) => (
                  <Input type="date" id="next_due_date" value={field.value || ""} onChange={field.onChange} onBlur={field.onBlur} />
                )}
              />
              {errors.next_due_date && <p className="mt-1 text-xs text-red-500">{errors.next_due_date.message}</p>}
            </div>
            <DialogFooter className="sm:col-span-2 pt-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setCreateOpen(false)}>
                {t("cancel", { defaultMessage: "Cancel" })}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-full bg-violet-600 hover:bg-violet-700">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("pm_create", { defaultMessage: "Create schedule" })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="glass-panel-strong sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("pm_history_title", { defaultMessage: "Completion history" })}</DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">{historyTitle}</p>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex items-center justify-center py-10 text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("loading", { defaultMessage: "Loading..." })}
            </div>
          ) : historyRows.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:bg-white/5">
              {t("pm_history_empty", { defaultMessage: "No completed work orders for this schedule yet." })}
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {historyRows.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => router.push(`/work-orders/${item.id}`)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2.5 text-left transition hover:border-violet-200 hover:bg-violet-50/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div>
                    <p className="font-semibold text-violet-700 dark:text-violet-300">{item.work_order_no}</p>
                    <p className="text-xs text-slate-500">{formatDay(item.completed_at)}</p>
                  </div>
                  <StatusBadge value={item.status} />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
