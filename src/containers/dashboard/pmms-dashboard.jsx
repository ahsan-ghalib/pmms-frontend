"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  CreditCard,
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

const EMPTY = {
  scope: "assigned",
  flags: {},
  kpis: {},
  charts: {},
  tables: {},
};

function ReportTable({ title, actionLabel, onAction, columns, rows, empty, onRow }) {
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

export default function PmmsDashboard() {
  const t = useT("common");
  const router = useRouter();
  const { data: session } = useSession();
  const role = normalizeRole(session?.user?.role);
  const [payload, setPayload] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
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
  const isSuper = flags.platform || role === Roles.SUPER_ADMIN;

  const title = isSuper
    ? t("dash_platform_title", { defaultMessage: "Platform command center" })
    : flags.company
      ? t("dash_company_title", { defaultMessage: "Company operations" })
      : t("dashboard_title", { defaultMessage: "Operations dashboard" });

  const description = isSuper
    ? t("dash_platform_desc", { defaultMessage: "Live reporting across companies, access, complaints, and field work." })
    : t("dash_company_desc", { defaultMessage: "Open work, overdue jobs, and the numbers that need attention today." });

  const alerts = useMemo(() => {
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
    return items;
  }, [kpis, t]);

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
    (isSuper || flags.company || role === Roles.SUPERVISOR || role === Roles.PROPERTY_MANAGER) && { title: t("dash_low_stock", { defaultMessage: "Low-stock parts" }), value: kpis.low_stock_parts ?? 0, hint: t("dash_hint_low_stock", { defaultMessage: "At or below minimum" }), theme: "rose", icon: Package, href: "/inventory" },
    (isSuper || flags.company || role === Roles.SUPERVISOR || role === Roles.PROPERTY_MANAGER) && { title: t("dash_sla_risk", { defaultMessage: "SLA at risk" }), value: kpis.sla_at_risk ?? 0, hint: t("dash_hint_sla_breach", { defaultMessage: "{count} already breached", count: kpis.sla_breached ?? 0 }), theme: "amber", icon: Timer, href: "/reports/sla" },
    { title: t("dash_pending", { defaultMessage: "Pending jobs" }), value: kpis.pending_work_orders ?? 0, hint: t("dash_hint_in_progress", { defaultMessage: "{count} in progress", count: kpis.in_progress_work_orders ?? 0 }), theme: "cyan", icon: ClipboardList, href: "/work-orders" },
    { title: t("dash_completed", { defaultMessage: "Completed jobs" }), value: kpis.completed_work_orders ?? 0, hint: t("dash_hint_completed", { defaultMessage: "Completed, verified, or closed" }), theme: "green", icon: ClipboardList, href: "/work-orders" },
    (isSuper || flags.company || role === Roles.SUPERVISOR || role === Roles.PROPERTY_MANAGER) && { title: t("dash_open_pr", { defaultMessage: "Open PRs" }), value: kpis.open_purchase_requests ?? 0, hint: t("dash_hint_open_pr", { defaultMessage: "Draft or submitted" }), theme: "violet", icon: Package, href: "/inventory/purchase-requests" },
  ].filter(Boolean);

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
          <Button variant="outline" className="rounded-full" onClick={load} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            {t("refresh", { defaultMessage: "Refresh" })}
          </Button>
        }
      />

      <OpsFilters
        filters={filters}
        setFilters={setFilters}
        onApply={(next) => load(next || {})}
        properties={properties}
        locations={tree.locations || []}
        subLocations={(tree.locations || []).flatMap((location) => location.sub_locations || location.subLocations || [])}
        units={(tree.locations || []).flatMap((location) => (location.sub_locations || location.subLocations || []).flatMap((sub) => sub.units || []))}
        categories={categories}
        services={categories.find((row) => row.id === filters.category_id)?.services || []}
        technicians={technicians}
        statuses={["created", "assigned", "in_progress", "on_hold", "completed", "verified", "closed", "submitted"]}
      />

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
            onClick={card.href ? () => router.push(card.href) : undefined}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <VolumeChart data={charts.volume_14d} />
        <StatusDonut
          title={t("dash_wo_status", { defaultMessage: "Work order status" })}
          subtitle={t("dash_wo_status_desc", { defaultMessage: "Current job pipeline." })}
          data={charts.work_order_status}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatusDonut
          title={t("dash_complaint_status", { defaultMessage: "Complaint status" })}
          subtitle={t("dash_complaint_status_desc", { defaultMessage: "Request lifecycle across the portfolio." })}
          data={charts.complaint_status}
        />
        <SimpleBars
          title={t("dash_priority", { defaultMessage: "Complaint priority" })}
          subtitle={t("dash_priority_desc", { defaultMessage: "Urgent vs normal mix." })}
          data={charts.priority}
        />
        <SimpleBars
          title={t("dash_wo_type", { defaultMessage: "Work order type" })}
          subtitle={t("dash_wo_type_desc", { defaultMessage: "Normal, urgent, and preventive jobs." })}
          data={charts.work_order_type}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <CategoryBars data={charts.categories} className={isSuper ? "md:col-span-2" : "md:col-span-3"} />
        {isSuper ? (
          <StatusDonut
            title={t("dash_access_mix", { defaultMessage: "Company access" })}
            subtitle={t("dash_access_mix_desc", { defaultMessage: "Trial, subscribed, or no access." })}
            data={charts.company_access}
          />
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportTable
          title={t("dash_table_urgent", { defaultMessage: "Urgent complaints" })}
          actionLabel={t("view_all", { defaultMessage: "View all" })}
          onAction={() => router.push("/complaints")}
          empty={t("dash_empty_urgent", { defaultMessage: "No urgent open complaints." })}
          rows={tables.urgent_complaints || []}
          onRow={(row) => router.push(`/complaints/${row.id}`)}
          columns={[
            { id: "ref", header: t("reference", { defaultMessage: "Reference" }), cell: (row) => <span className="font-semibold text-violet-700 dark:text-violet-300">{row.reference_no}</span> },
            { id: "property", header: t("property", { defaultMessage: "Property" }), cell: (row) => row.property_name || "—" },
            { id: "category", header: t("category", { defaultMessage: "Category" }), cell: (row) => row.category_name || "—" },
            { id: "priority", header: t("priority", { defaultMessage: "Priority" }), cell: (row) => <PriorityBadge value={row.priority} /> },
            { id: "status", header: t("status", { defaultMessage: "Status" }), cell: (row) => <StatusBadge value={row.status} /> },
          ]}
        />
        <ReportTable
          title={t("dash_table_attention_wo", { defaultMessage: "Jobs needing action" })}
          actionLabel={t("view_all", { defaultMessage: "View all" })}
          onAction={() => router.push("/work-orders")}
          empty={t("dash_empty_wo", { defaultMessage: "No overdue, held, or unassigned jobs." })}
          rows={tables.attention_work_orders || []}
          onRow={(row) => router.push(`/work-orders/${row.id}`)}
          columns={[
            { id: "no", header: t("work_order", { defaultMessage: "Work order" }), cell: (row) => <span className="font-semibold text-violet-700 dark:text-violet-300">{row.work_order_no}</span> },
            { id: "property", header: t("property", { defaultMessage: "Property" }), cell: (row) => row.property_name || "—" },
            { id: "reason", header: t("reason", { defaultMessage: "Reason" }), cell: (row) => <StatusBadge value={row.reason} /> },
            { id: "status", header: t("status", { defaultMessage: "Status" }), cell: (row) => <StatusBadge value={row.status} /> },
            { id: "date", header: t("scheduled", { defaultMessage: "Scheduled" }), cell: (row) => formatDay(row.scheduled_date) },
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportTable
          title={t("recent_complaints", { defaultMessage: "Recent complaints" })}
          actionLabel={t("view_all", { defaultMessage: "View all" })}
          onAction={() => router.push("/complaints")}
          empty={t("dash_empty_recent_c", { defaultMessage: "No complaints yet." })}
          rows={tables.recent_complaints || []}
          onRow={(row) => router.push(`/complaints/${row.id}`)}
          columns={[
            { id: "ref", header: t("reference", { defaultMessage: "Reference" }), cell: (row) => <span className="font-semibold">{row.reference_no}</span> },
            { id: "property", header: t("property", { defaultMessage: "Property" }), cell: (row) => row.property_name || "—" },
            { id: "status", header: t("status", { defaultMessage: "Status" }), cell: (row) => <StatusBadge value={row.status} /> },
            { id: "when", header: t("submitted", { defaultMessage: "Submitted" }), cell: (row) => formatDate(row.submitted_at) },
          ]}
        />
        <ReportTable
          title={t("recent_work_orders", { defaultMessage: "Recent work orders" })}
          actionLabel={t("view_all", { defaultMessage: "View all" })}
          onAction={() => router.push("/work-orders")}
          empty={t("dash_empty_recent_wo", { defaultMessage: "No work orders yet." })}
          rows={tables.recent_work_orders || []}
          onRow={(row) => router.push(`/work-orders/${row.id}`)}
          columns={[
            { id: "no", header: t("work_order", { defaultMessage: "Work order" }), cell: (row) => <span className="font-semibold">{row.work_order_no}</span> },
            { id: "property", header: t("property", { defaultMessage: "Property" }), cell: (row) => row.property_name || "—" },
            { id: "status", header: t("status", { defaultMessage: "Status" }), cell: (row) => <StatusBadge value={row.status} /> },
            { id: "type", header: t("type", { defaultMessage: "Type" }), cell: (row) => labelize(row.type) },
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {(isSuper || flags.company) && (
          <ReportTable
            title={isSuper ? t("dash_table_companies", { defaultMessage: "Companies needing access" }) : t("dash_table_access", { defaultMessage: "Access watchlist" })}
            actionLabel={t("view_all", { defaultMessage: "View all" })}
            onAction={() => router.push(isSuper ? "/companies" : "/subscriptions")}
            empty={t("dash_empty_access", { defaultMessage: "No companies are missing access or ending trial." })}
            rows={tables.companies_attention || []}
            onRow={(row) => router.push(isSuper ? `/companies/${row.id}` : "/subscriptions")}
            columns={[
              { id: "name", header: t("company", { defaultMessage: "Company" }), cell: (row) => (
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="font-mono text-[11px] text-slate-400">{row.code}</p>
                </div>
              ) },
              { id: "access", header: t("access", { defaultMessage: "Access" }), cell: (row) => <StatusBadge value={row.access === "none" ? "inactive" : row.access} /> },
              { id: "reason", header: t("reason", { defaultMessage: "Reason" }), cell: (row) => labelize(row.reason) },
              { id: "expires", header: t("expires", { defaultMessage: "Expires" }), cell: (row) => formatDate(row.expires_at) },
            ]}
          />
        )}
        {(isSuper || flags.company) && (
          <ReportTable
            title={t("dash_table_trials", { defaultMessage: "Trials ending soon" })}
            actionLabel={t("view_all", { defaultMessage: "View all" })}
            onAction={() => router.push("/trials")}
            empty={t("dash_empty_trials", { defaultMessage: "No trials ending in the next 14 days." })}
            rows={tables.expiring_trials || []}
            onRow={(row) => router.push("/trials")}
            columns={[
              { id: "company", header: t("company", { defaultMessage: "Company" }), cell: (row) => row.company_name || "—" },
              { id: "status", header: t("status", { defaultMessage: "Status" }), cell: (row) => <StatusBadge value={row.status} /> },
              { id: "days", header: t("days_left", { defaultMessage: "Days left" }), cell: (row) => row.days_left ?? "—" },
              { id: "expires", header: t("expires", { defaultMessage: "Expires" }), cell: (row) => formatDate(row.expires_at) },
            ]}
          />
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {flags.field_ops && (
          <ReportTable
            title={t("dash_table_duty", { defaultMessage: "Technicians on duty" })}
            actionLabel={t("view_all", { defaultMessage: "View all" })}
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
          title={t("dash_table_tech", { defaultMessage: "Technician performance" })}
          actionLabel={t("view_all", { defaultMessage: "View all" })}
          onAction={() => router.push("/reports/technician_performance")}
          empty={t("dash_empty_tech", { defaultMessage: "No technician assignments in this filter." })}
          rows={tables.technician_performance || []}
          columns={[
            { id: "name", header: t("technician", { defaultMessage: "Technician" }), cell: (row) => row.name || "—" },
            { id: "assigned", header: t("assigned", { defaultMessage: "Assigned" }), cell: (row) => row.assigned ?? 0 },
            { id: "completed", header: t("completed", { defaultMessage: "Completed" }), cell: (row) => row.completed ?? 0 },
            { id: "overdue", header: t("overdue", { defaultMessage: "Overdue" }), cell: (row) => row.overdue ?? 0 },
          ]}
        />
        <ReportTable
          title={t("dash_table_low_stock", { defaultMessage: "Low-stock parts" })}
          actionLabel={t("view_all", { defaultMessage: "View all" })}
          onAction={() => router.push("/inventory")}
          empty={t("dash_empty_low_stock", { defaultMessage: "No parts are at or below minimum stock." })}
          rows={tables.low_stock_parts || []}
          onRow={(row) => row?.id && router.push(`/inventory/parts/${row.id}`)}
          columns={[
            { id: "name", header: t("part", { defaultMessage: "Part" }), cell: (row) => row.name || "—" },
            { id: "sku", header: t("sku", { defaultMessage: "SKU" }), cell: (row) => row.sku || "—" },
            { id: "on_hand", header: t("on_hand", { defaultMessage: "On hand" }), cell: (row) => row.on_hand ?? 0 },
            { id: "min", header: t("min_stock", { defaultMessage: "Minimum" }), cell: (row) => row.minimum_stock ?? 0 },
          ]}
        />
        <ReportTable
          title={t("dash_table_asset_pm", { defaultMessage: "Asset maintenance due" })}
          actionLabel={t("view_all", { defaultMessage: "View all" })}
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
