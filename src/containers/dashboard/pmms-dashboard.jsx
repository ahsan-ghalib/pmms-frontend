"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Filter,
  Hourglass,
  Landmark,
  LayoutDashboard,
  Package,
  Timer,
  MessageSquareWarning,
  PauseCircle,
  Radio,
  RefreshCw,
  UserRound,
  Wrench,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import EmptyState from "@/components/pmms/empty-state";
import { PriorityBadge, StatusBadge } from "@/components/pmms/status-badge";
import { Button } from "@/components/ui/button";
import { dashboardApi } from "@/services/dashboard/dashboard-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { pmmsUsersApi } from "@/services/users/pmms-users-api";
import OpsFilters from "@/components/pmms/ops-filters";
import { apiError, formatDate, formatDay, labelize } from "@/lib/pmms";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";
import { CategoryBars, SimpleBars, StatusDonut, VolumeChart } from "@/containers/dashboard/dashboard-charts";
import ExpiryCountdown from "@/components/pmms/expiry-countdown";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { useModuleAccess } from "@/hooks/use-module-access";
import { moduleForPath } from "@/lib/permissions/module-access";
const EMPTY = {
  scope: "assigned",
  flags: {},
  kpis: {},
  charts: {},
  tables: {},
};

function ReportTable({ title, actionLabel, onAction, columns, rows, empty, onRow, visible = true }) {
  if (!visible) return null;

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
        {actionLabel && onAction ? (
          <Button variant="ghost" size="sm" className="text-violet-700 dark:text-violet-300" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </div>
      {!rows.length ? (
        <p className="py-8 text-center text-sm text-slate-400">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 text-left text-[11px] uppercase tracking-wider text-slate-400 dark:border-white/10">
                {columns.map((column) => (
                  <th key={column.id} className="pb-2 font-semibold">{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  tabIndex={onRow ? 0 : undefined}
                  role={onRow ? "button" : undefined}
                  className={cn(
                    "border-b border-slate-100 last:border-0 dark:border-white/5",
                    onRow && "cursor-pointer hover:bg-violet-50/50 dark:hover:bg-white/5"
                  )}
                  onClick={onRow ? () => onRow(row) : undefined}
                  onKeyDown={onRow ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRow(row);
                    }
                  } : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.id} className="py-2.5 align-middle text-slate-700 dark:text-slate-200">
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const TYPE_STYLES = {
  complaint: { icon: MessageSquareWarning, className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200" },
  work_order: { icon: ClipboardList, className: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200" },
};

function OperationsQueue({ rows, showComplaints, showWorkOrders, onOpen, onViewAll }) {
  const t = useT("common");
  const [type, setType] = useState("all");

  if (!showComplaints && !showWorkOrders) return null;

  const both = showComplaints && showWorkOrders;
  const visible = rows.filter((row) => type === "all" || row.type === type);
  const placeLabel = {
    unit: t("unit", { defaultMessage: "Unit" }),
    sub_location: t("sub_location", { defaultMessage: "Sub-location" }),
    location: t("location", { defaultMessage: "Location" }),
  };
  const typeLabel = {
    complaint: t("complaint", { defaultMessage: "Complaint" }),
    work_order: t("work_order", { defaultMessage: "Work order" }),
  };
  const tabs = [
    { id: "all", label: t("all", { defaultMessage: "All" }), count: rows.length },
    { id: "complaint", label: t("complaints", { defaultMessage: "Complaints" }), count: rows.filter((row) => row.type === "complaint").length },
    { id: "work_order", label: t("work_orders", { defaultMessage: "Work orders" }), count: rows.filter((row) => row.type === "work_order").length },
  ];

  return (
    <section className="glass-panel rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{t("dash_queue_title", { defaultMessage: "Complaints & work orders" })}</p>
          <p className="text-xs text-slate-500">{t("dash_queue_desc", { defaultMessage: "Pending and unassigned first, then assigned, in progress, on hold, completed and closed." })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {both && (
            <div className="flex rounded-full bg-slate-100 p-0.5 dark:bg-white/10">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setType(tab.id)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition",
                    type === tab.id ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-500"
                  )}
                >
                  {tab.label} · {tab.count}
                </button>
              ))}
            </div>
          )}
          {showComplaints && (
            <Button variant="ghost" size="sm" className="text-violet-700 dark:text-violet-300" onClick={() => onViewAll("/complaints")}>
              {t("dash_view_all_complaints", { defaultMessage: "View all complaints" })}
            </Button>
          )}
          {showWorkOrders && (
            <Button variant="ghost" size="sm" className="text-violet-700 dark:text-violet-300" onClick={() => onViewAll("/work-orders")}>
              {t("dash_view_all_work_orders", { defaultMessage: "View all work orders" })}
            </Button>
          )}
        </div>
      </div>
      {!visible.length ? (
        <p className="py-8 text-center text-sm text-slate-400">{t("dash_queue_empty", { defaultMessage: "No complaints or work orders match these filters." })}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 text-left text-[11px] uppercase tracking-wider text-slate-400 dark:border-white/10">
                <th className="pb-2 pr-3 font-semibold">{t("serial_no", { defaultMessage: "S.No." })}</th>
                <th className="pb-2 pr-3 font-semibold">{t("type", { defaultMessage: "Type" })}</th>
                <th className="pb-2 pr-3 font-semibold">{t("dash_record_no", { defaultMessage: "Complaint / WO No." })}</th>
                <th className="pb-2 pr-3 font-semibold">{t("dash_property_place", { defaultMessage: "Property / Sub-location or Unit" })}</th>
                <th className="pb-2 pr-3 font-semibold">{t("dash_category_service", { defaultMessage: "Category & Service" })}</th>
                <th className="pb-2 pr-3 font-semibold">{t("priority", { defaultMessage: "Priority" })}</th>
                <th className="pb-2 pr-3 font-semibold">{t("technician", { defaultMessage: "Technician" })}</th>
                <th className="pb-2 font-semibold">{t("status", { defaultMessage: "Status" })}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row, index) => {
                const style = TYPE_STYLES[row.type] || TYPE_STYLES.work_order;
                const TypeIcon = style.icon;
                return (
                  <tr
                    key={row.key}
                    tabIndex={0}
                    role="button"
                    className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-violet-50/50 dark:border-white/5 dark:hover:bg-white/5"
                    onClick={() => onOpen(row)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpen(row);
                      }
                    }}
                  >
                    <td className="py-2.5 pr-3 text-slate-400">{index + 1}</td>
                    <td className="py-2.5 pr-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", style.className)}>
                        <TypeIcon className="h-3 w-3" />
                        {typeLabel[row.type]}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-semibold text-violet-700 dark:text-violet-300">{row.number || "—"}</td>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{row.property_name || "—"}</p>
                      {row.place_name && <p className="text-xs text-slate-500">{placeLabel[row.place_level]}: {row.place_name}</p>}
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="text-slate-800 dark:text-slate-100">{row.category_name || "—"}</p>
                      {row.service_name && <p className="text-xs text-slate-500">{row.service_name}</p>}
                    </td>
                    <td className="py-2.5 pr-3"><PriorityBadge value={row.priority || "normal"} /></td>
                    <td className="py-2.5 pr-3 text-slate-700 dark:text-slate-200">{row.technician_name || <span className="text-slate-400">{t("unassigned", { defaultMessage: "Unassigned" })}</span>}</td>
                    <td className="py-2.5"><StatusBadge value={row.display_status || row.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AccessIndicator({ items }) {
  const t = useT("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const urgent = items.some((item) => item.tone === "rose");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 rounded-full px-3 text-xs font-semibold",
            items.length > 0 && (urgent
              ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
              : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200")
          )}
          aria-label={t("dash_access_watch", { defaultMessage: "Access & trials" })}
        >
          <Hourglass className="mr-1.5 h-3.5 w-3.5" />
          {t("dash_access_watch", { defaultMessage: "Access & trials" })}
          <span className="ml-1.5 rounded-full bg-white/80 px-1.5 text-[10px] dark:bg-black/20">{items.length}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">{t("dash_access_watch_title", { defaultMessage: "Access watchlist & trials ending soon" })}</p>
        </div>
        {!items.length ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">{t("dash_empty_access", { defaultMessage: "No companies are missing access or ending trial." })}</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {items.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition hover:bg-violet-50/60 dark:hover:bg-white/5"
                  onClick={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                >
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.tone === "rose" ? "bg-rose-500" : "bg-amber-500")} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.title || "—"}</span>
                    <span className="block text-xs text-slate-500">{item.detail}</span>
                    {item.expiresAt && (
                      <span className="block text-xs text-slate-400">
                        {t("expires", { defaultMessage: "Expires" })}: {formatDate(item.expiresAt)}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function PmmsDashboard() {
  const t = useT("common");
  const router = useRouter();
  const { data: session } = useSession();
  const role = normalizeRole(session?.user?.role);
  const { canUsePath, featureForPath, warnLocked } = usePlanAccess();
  const { canSee } = useModuleAccess();
  const showsPath = (href) => canSee(moduleForPath(href));
  const seesOps = canSee("complaints") || canSee("work-orders");
  const [payload, setPayload] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const [tree, setTree] = useState({ locations: [] });
  const [categories, setCategories] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const load = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(nextFilters || {}).filter(([, value]) => value));
      const data = await dashboardApi.overview(params);
      setPayload(data && typeof data === "object" ? data : EMPTY);
    } catch (error) {
      toast.error(apiError(error, t("dash_load_failed", { defaultMessage: "Failed to load dashboard" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    propertiesApi.list().then((data) => setProperties(Array.isArray(data) ? data : [])).catch(() => {});
    complaintsApi.categories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
    pmmsUsersApi.list({ role: "technician" }).then((data) => setTechnicians(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!filters.property_id) {
      setTree({ locations: [] });
      return;
    }
    propertiesApi.tree(filters.property_id).then((data) => setTree(data || { locations: [] })).catch(() => setTree({ locations: [] }));
  }, [filters.property_id]);

  const kpis = payload.kpis || {};
  const charts = payload.charts || {};
  const tables = payload.tables || {};
  const flags = payload.flags || {};
  const entitlements = payload.entitlements || session?.user?.entitlements || {};
  const isSuper = flags.platform || role === Roles.SUPER_ADMIN;

  const title = isSuper
    ? t("dash_platform_title", { defaultMessage: "Platform command center" })
    : flags.company
      ? t("dash_company_title", { defaultMessage: "Company operations" })
      : t("dashboard_title", { defaultMessage: "Operations dashboard" });

  const description = isSuper
    ? t("dash_platform_desc", { defaultMessage: "Live reporting across companies, access, complaints, and field work." })
    : t("dash_company_desc", { defaultMessage: "Open work, overdue jobs, and the numbers that need attention today." });

  const alerts = (() => {
    const items = [];
    if (kpis.urgent_complaints) items.push({ label: t("dash_alert_urgent", { defaultMessage: "{count} urgent complaints", count: kpis.urgent_complaints }), href: "/complaints" });
    if (kpis.overdue_work_orders) items.push({ label: t("dash_alert_overdue", { defaultMessage: "{count} overdue jobs", count: kpis.overdue_work_orders }), href: "/work-orders" });
    if (kpis.on_hold_work_orders) items.push({ label: t("dash_alert_hold", { defaultMessage: "{count} on hold", count: kpis.on_hold_work_orders }), href: "/work-orders" });
    if (kpis.unassigned_work_orders) items.push({ label: t("dash_alert_unassigned", { defaultMessage: "{count} unassigned", count: kpis.unassigned_work_orders }), href: "/work-orders" });
    if (kpis.trials_expiring_soon) items.push({ label: t("dash_alert_trials", { defaultMessage: "{count} trials ending", count: kpis.trials_expiring_soon }), href: "/trials" });
    if (kpis.subscriptions_expiring_soon) items.push({ label: t("dash_alert_subs", { defaultMessage: "{count} subscriptions ending", count: kpis.subscriptions_expiring_soon }), href: "/subscriptions" });
    if (kpis.pm_due_soon) items.push({ label: t("dash_alert_pm", { defaultMessage: "{count} PM due", count: kpis.pm_due_soon }), href: "/maintenance-schedules" });
    if (kpis.low_stock_parts) items.push({ label: t("dash_alert_low_stock", { defaultMessage: "{count} low-stock parts", count: kpis.low_stock_parts }), href: "/inventory" });
    if (kpis.sla_at_risk) items.push({ label: t("dash_alert_sla_risk", { defaultMessage: "{count} SLA at risk", count: kpis.sla_at_risk }), href: "/reports/sla" });
    if (kpis.sla_breached) items.push({ label: t("dash_alert_sla_breach", { defaultMessage: "{count} SLA breached", count: kpis.sla_breached }), href: "/reports/sla" });
    return items.filter((item) => showsPath(item.href));
  })();

  const cards = [
    isSuper && { title: t("companies", { defaultMessage: "Companies" }), value: kpis.companies ?? 0, hint: t("dash_hint_companies", { defaultMessage: "{trial} trial · {paid} subscribed", trial: kpis.companies_trial ?? 0, paid: kpis.companies_subscribed ?? 0 }), theme: "indigo", icon: Building2, href: "/companies" },
    { title: t("properties", { defaultMessage: "Properties" }), value: kpis.properties ?? 0, hint: t("dash_hint_properties", { defaultMessage: "Active portfolio" }), theme: "purple", icon: Landmark, href: "/properties" },
    flags.users && { title: t("users", { defaultMessage: "Users" }), value: kpis.users ?? 0, hint: t("dash_hint_users", { defaultMessage: "Accounts in scope" }), theme: "cyan", icon: UserRound, href: "/users" },
    { title: t("open_complaints", { defaultMessage: "Open complaints" }), value: kpis.open_complaints ?? 0, hint: t("dash_hint_complaints", { defaultMessage: "{count} submitted today", count: kpis.complaints_today ?? 0 }), theme: "amber", icon: MessageSquareWarning, href: "/complaints" },
    { title: t("dash_urgent", { defaultMessage: "Urgent open" }), value: kpis.urgent_complaints ?? 0, hint: t("dash_hint_urgent", { defaultMessage: "Need same-day attention" }), theme: "rose", icon: AlertTriangle, href: "/complaints" },
    { title: t("active_work_orders", { defaultMessage: "Active work orders" }), value: kpis.active_work_orders ?? 0, hint: t("dash_hint_active_wo", { defaultMessage: "{count} completed this week", count: kpis.completed_this_week ?? 0 }), theme: "blue", icon: ClipboardList, href: "/work-orders" },
    { title: t("dash_overdue", { defaultMessage: "Overdue jobs" }), value: kpis.overdue_work_orders ?? 0, hint: t("dash_hint_overdue", { defaultMessage: "Past scheduled date" }), theme: "orange", icon: Timer, href: "/work-orders" },
    { title: t("dash_on_hold", { defaultMessage: "On hold" }), value: kpis.on_hold_work_orders ?? 0, hint: t("dash_hint_hold", { defaultMessage: "{count} still unassigned", count: kpis.unassigned_work_orders ?? 0 }), theme: "amber", icon: PauseCircle, href: "/work-orders" },
    flags.field_ops && { title: t("dash_on_duty", { defaultMessage: "Technicians on duty" }), value: kpis.technicians_on_duty ?? 0, hint: t("dash_hint_duty", { defaultMessage: "Live field coverage" }), theme: "teal", icon: Radio, href: "/live-map" },
    (isSuper || flags.company) && { title: t("dash_trials", { defaultMessage: "Active trials" }), value: kpis.active_trials ?? 0, hint: t("dash_hint_trials", { defaultMessage: "{count} ending in 14 days", count: kpis.trials_expiring_soon ?? 0 }), theme: "orange", icon: Timer, href: "/trials" },
    (isSuper || flags.company) && { title: t("dash_subscriptions", { defaultMessage: "Active subscriptions" }), value: kpis.active_subscriptions ?? 0, hint: t("dash_hint_subs", { defaultMessage: "{count} ending in 14 days", count: kpis.subscriptions_expiring_soon ?? 0 }), theme: "green", icon: CreditCard, href: "/subscriptions" },
    { title: t("dash_pm_due", { defaultMessage: "PM due soon" }), value: kpis.pm_due_soon ?? 0, hint: t("dash_hint_pm", { defaultMessage: "Next 7 days" }), theme: "indigo", icon: Wrench, href: "/maintenance-schedules" },
    { title: t("dash_low_stock", { defaultMessage: "Low-stock parts" }), value: kpis.low_stock_parts ?? 0, hint: t("dash_hint_low_stock", { defaultMessage: "At or below minimum" }), theme: "rose", icon: Package, href: "/inventory" },
    { title: t("dash_sla_risk", { defaultMessage: "SLA at risk" }), value: kpis.sla_at_risk ?? 0, hint: t("dash_hint_sla_breach", { defaultMessage: "{count} already breached", count: kpis.sla_breached ?? 0 }), theme: "amber", icon: Timer, href: "/reports/sla" },
    { title: t("dash_pending", { defaultMessage: "Pending jobs" }), value: kpis.pending_work_orders ?? 0, hint: t("dash_hint_in_progress", { defaultMessage: "{count} in progress", count: kpis.in_progress_work_orders ?? 0 }), theme: "cyan", icon: ClipboardList, href: "/work-orders" },
    { title: t("dash_completed", { defaultMessage: "Completed jobs" }), value: kpis.completed_work_orders ?? 0, hint: t("dash_hint_completed", { defaultMessage: "Completed, verified, or closed" }), theme: "green", icon: ClipboardList, href: "/work-orders" },
    { title: t("dash_open_pr", { defaultMessage: "Open PRs" }), value: kpis.open_purchase_requests ?? 0, hint: t("dash_hint_open_pr", { defaultMessage: "Draft or submitted" }), theme: "violet", icon: Package, href: "/inventory/purchase-requests" },
  ].filter((card) => card && showsPath(card.href));

  const activeFilters = Object.values(filters).filter(Boolean).length;
  const companyHref = (companyId, fallback) => (isSuper && companyId ? `/companies/${companyId}` : fallback);
  const trialCompanies = new Set((tables.expiring_trials || []).map((row) => row.company_id));
  const accessItems = [
    ...(tables.companies_attention || [])
      .filter((row) => !(row.reason === "trial_ending" && trialCompanies.has(row.id)))
      .map((row) => ({
        key: `access-${row.id}`,
        title: row.name,
        detail: row.reason === "no_access"
          ? t("dash_access_none", { defaultMessage: "No active access" })
          : t("dash_access_trial_ending", { defaultMessage: "Trial ending" }),
        expiresAt: row.expires_at,
        tone: row.reason === "no_access" ? "rose" : "amber",
        href: companyHref(row.id, "/subscriptions"),
      })),
    ...(tables.expiring_trials || []).map((row) => ({
      key: `trial-${row.id}`,
      title: row.company_name,
      detail: t("dash_trial_days_left", { defaultMessage: "Trial · {count} days left", count: row.days_left ?? 0 }),
      expiresAt: row.expires_at,
      tone: "amber",
      href: companyHref(row.company_id, showsPath("/trials") ? "/trials" : "/subscriptions"),
    })),
    ...(tables.expiring_subscriptions || []).map((row) => ({
      key: `subscription-${row.id}`,
      title: row.company_name,
      detail: t("dash_subscription_days_left", { defaultMessage: "{plan} · {count} days left", plan: row.plan_name || t("subscription", { defaultMessage: "Subscription" }), count: row.days_left ?? 0 }),
      expiresAt: row.ends_at,
      tone: "amber",
      href: companyHref(row.company_id, "/subscriptions"),
    })),
  ];

  if (loading && !payload.generated_at) {
    return (
      <div className="space-y-6">
        <div className="glass-panel h-24 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-white/60 dark:bg-slate-900/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title={title}
        description={description}
        actions={
          <div className="flex items-center gap-2">
            {(isSuper || flags.company) && <AccessIndicator items={accessItems} />}
            <Button
              variant="outline"
              size="icon"
              className="relative rounded-full"
              aria-label={t("filters", { defaultMessage: "Filters" })}
              title={t("filters", { defaultMessage: "Filters" })}
              onClick={() => setFiltersOpen(true)}
            >
              <Filter className="h-4 w-4" />
              {activeFilters > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
                  {activeFilters}
                </span>
              )}
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => load()} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              {t("refresh", { defaultMessage: "Refresh" })}
            </Button>
          </div>
        }
      />

      {!isSuper && (
        <ExpiryCountdown
          access={entitlements.access}
          planName={entitlements.plan_name}
          expiresAt={entitlements.expires_at}
        />
      )}

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{t("dash_filters_title", { defaultMessage: "Dashboard filters" })}</SheetTitle>
            <SheetDescription>{t("dash_filters_desc", { defaultMessage: "Filters apply to the numbers, charts and lists on this dashboard." })}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <OpsFilters
              className="md:grid-cols-2"
              filters={filters}
              setFilters={setFilters}
              onApply={(next) => load(next || {})}
              onDone={() => setFiltersOpen(false)}
              properties={properties}
              locations={tree.locations || []}
              subLocations={(tree.locations || []).flatMap((location) => location.sub_locations || location.subLocations || [])}
              units={(tree.locations || []).flatMap((location) => (location.sub_locations || location.subLocations || []).flatMap((sub) => sub.units || []))}
              categories={categories}
              services={categories.find((row) => row.id === filters.category_id)?.services || []}
              technicians={technicians}
              statuses={["created", "assigned", "in_progress", "on_hold", "completed", "verified", "closed", "submitted"]}
            />
          </div>
        </SheetContent>
      </Sheet>

      {alerts.length > 0 && (
        <div className="glass-panel flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3">
          <span className="mr-1 text-xs font-bold uppercase tracking-wider text-rose-500">
            {t("dash_needs_attention", { defaultMessage: "Needs attention" })}
          </span>
          {alerts.map((alert) => (
            <button
              key={alert.label}
              type="button"
              onClick={() => router.push(alert.href)}
              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
            >
              {alert.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            hint={card.hint}
            theme={card.theme}
            icon={card.icon}
            onClick={card.href ? () => {
              if (featureForPath(card.href) && !canUsePath(card.href)) {
                warnLocked();
                return;
              }
              router.push(card.href);
            } : undefined}
          />
        ))}
      </div>

      <OperationsQueue
        rows={tables.operations_queue || []}
        showComplaints={showsPath("/complaints")}
        showWorkOrders={showsPath("/work-orders")}
        onOpen={(row) => router.push(row.type === "complaint" ? `/complaints/${row.id}` : `/work-orders/${row.id}`)}
        onViewAll={(href) => router.push(href)}
      />

      {(seesOps || isSuper) && (
        <section className="glass-panel rounded-2xl">
          <button
            type="button"
            aria-expanded={chartsOpen}
            onClick={() => setChartsOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition hover:bg-violet-50/40 dark:hover:bg-white/5"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                <BarChart3 className="h-4 w-4" />
              </span>
              <span>
                <span className="block font-semibold text-slate-900 dark:text-white">{t("dash_analytics_title", { defaultMessage: "Analytics & Charts" })}</span>
                <span className="block text-xs text-slate-500">{t("dash_analytics_desc", { defaultMessage: "14-day volume, status, priority, type and category mix." })}</span>
              </span>
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
              {chartsOpen ? t("hide", { defaultMessage: "Hide" }) : t("show", { defaultMessage: "Show" })}
              <ChevronDown className={cn("h-4 w-4 transition-transform", chartsOpen && "rotate-180")} />
            </span>
          </button>
          {chartsOpen && (
            <div className="space-y-4 px-5 pb-5">
              <div className="grid gap-4 md:grid-cols-3">
                {seesOps && <VolumeChart data={charts.volume_14d} />}
                {canSee("work-orders") && (
                  <StatusDonut
                    title={t("dash_wo_status", { defaultMessage: "Work order status" })}
                    subtitle={t("dash_wo_status_desc", { defaultMessage: "Current job pipeline." })}
                    data={charts.work_order_status}
                  />
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {canSee("complaints") && (
                  <StatusDonut
                    title={t("dash_complaint_status", { defaultMessage: "Complaint status" })}
                    subtitle={t("dash_complaint_status_desc", { defaultMessage: "Request lifecycle across the portfolio." })}
                    data={charts.complaint_status}
                  />
                )}
                {canSee("complaints") && (
                  <SimpleBars
                    title={t("dash_priority", { defaultMessage: "Complaint priority" })}
                    subtitle={t("dash_priority_desc", { defaultMessage: "Urgent vs normal mix." })}
                    data={charts.priority}
                  />
                )}
                {canSee("work-orders") && (
                  <SimpleBars
                    title={t("dash_wo_type", { defaultMessage: "Work order type" })}
                    subtitle={t("dash_wo_type_desc", { defaultMessage: "Normal, urgent, and preventive jobs." })}
                    data={charts.work_order_type}
                  />
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {seesOps && <CategoryBars data={charts.categories} className={isSuper ? "md:col-span-2" : "md:col-span-3"} />}
                {isSuper ? (
                  <StatusDonut
                    title={t("dash_access_mix", { defaultMessage: "Company access" })}
                    subtitle={t("dash_access_mix_desc", { defaultMessage: "Trial, subscribed, or no access." })}
                    data={charts.company_access}
                  />
                ) : null}
              </div>
            </div>
          )}
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {flags.field_ops && (
          <ReportTable
            title={t("dash_table_duty", { defaultMessage: "Technicians on duty" })}
            actionLabel={t("view_all", { defaultMessage: "View all" })}
            visible={showsPath("/live-map")}
            onAction={() => router.push("/live-map")}
            empty={t("dash_empty_duty", { defaultMessage: "No technicians are on duty right now." })}
            rows={tables.on_duty_technicians || []}
            columns={[
              { id: "name", header: t("technician", { defaultMessage: "Technician" }), cell: (row) => row.name || "—" },
              { id: "job", header: t("current_job", { defaultMessage: "Current job" }), cell: (row) => row.current_work_order_no || t("available", { defaultMessage: "Available" }) },
              { id: "stale", header: t("signal", { defaultMessage: "Signal" }), cell: (row) => <StatusBadge value={row.stale ? "stale" : "live"} /> },
              { id: "updated", header: t("updated", { defaultMessage: "Updated" }), cell: (row) => formatDate(row.last_update_at) },
            ]}
          />
        )}
        <ReportTable
          title={t("dash_table_pm", { defaultMessage: "Preventive maintenance due" })}
          actionLabel={t("view_all", { defaultMessage: "View all" })}
          visible={showsPath("/maintenance-schedules")}
          onAction={() => router.push("/maintenance-schedules")}
          empty={t("dash_empty_pm", { defaultMessage: "No preventive jobs due in the next 7 days." })}
          rows={tables.pm_due || []}
          onRow={() => router.push("/maintenance-schedules")}
          columns={[
            { id: "property", header: t("property", { defaultMessage: "Property" }), cell: (row) => row.property_name || "—" },
            { id: "asset", header: t("asset", { defaultMessage: "Asset" }), cell: (row) => row.asset_name || row.asset_code || "—" },
            { id: "category", header: t("category", { defaultMessage: "Category" }), cell: (row) => row.category_name || "—" },
            { id: "freq", header: t("frequency", { defaultMessage: "Frequency" }), cell: (row) => labelize(row.frequency) },
            { id: "due", header: t("due", { defaultMessage: "Due" }), cell: (row) => (
              <span className={row.is_overdue ? "font-semibold text-rose-600" : ""}>{formatDay(row.next_due_date)}</span>
            ) },
          ]}
        />
        <ReportTable
          title={t("dash_table_sla", { defaultMessage: "SLA needing attention" })}
          actionLabel={t("view_all", { defaultMessage: "View all" })}
          visible={showsPath("/reports/sla")}
          onAction={() => router.push("/reports/sla")}
          empty={t("dash_empty_sla", { defaultMessage: "No SLA clocks are at risk or breached." })}
          rows={tables.sla_attention || []}
          onRow={(row) => row?.id && router.push(`/work-orders/${row.id}`)}
          columns={[
            { id: "no", header: t("work_order", { defaultMessage: "Work order" }), cell: (row) => row.work_order_no || "—" },
            { id: "property", header: t("property", { defaultMessage: "Property" }), cell: (row) => row.property_name || "—" },
            { id: "overall", header: t("sla", { defaultMessage: "SLA" }), cell: (row) => <StatusBadge value={row.overall} /> },
            { id: "resolution", header: t("resolution", { defaultMessage: "Resolution" }), cell: (row) => <StatusBadge value={row.resolution_status || "—"} /> },
          ]}
        />
        <ReportTable
          title={t("dash_table_asset_pm", { defaultMessage: "Asset maintenance due" })}
          actionLabel={t("view_all", { defaultMessage: "View all" })}
          visible={showsPath("/assets")}
          onAction={() => router.push("/assets")}
          empty={t("dash_empty_asset_pm", { defaultMessage: "No asset maintenance due in the next 7 days." })}
          rows={tables.asset_pm_due || []}
          onRow={(row) => row?.id && router.push(`/assets/${row.id}`)}
          columns={[
            { id: "asset", header: t("asset", { defaultMessage: "Asset" }), cell: (row) => row.asset_name || "—" },
            { id: "code", header: t("code", { defaultMessage: "Code" }), cell: (row) => row.asset_code || "—" },
            { id: "property", header: t("property", { defaultMessage: "Property" }), cell: (row) => row.property_name || "—" },
            { id: "freq", header: t("frequency", { defaultMessage: "Frequency" }), cell: (row) => labelize(row.frequency) },
            { id: "due", header: t("due", { defaultMessage: "Due" }), cell: (row) => (
              <span className={row.is_overdue ? "font-semibold text-rose-600" : ""}>{formatDay(row.next_due_date)}</span>
            ) },
          ]}
        />
      </div>

      {!payload.generated_at && !loading ? (
        <EmptyState
          icon={LayoutDashboard}
          title={t("dash_empty_title", { defaultMessage: "Dashboard is empty" })}
          description={t("dash_empty_desc", { defaultMessage: "Once companies, complaints, and work orders exist, reporting will appear here." })}
        />
      ) : null}
    </div>
  );
}
