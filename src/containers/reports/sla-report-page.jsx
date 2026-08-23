"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/common/data-table";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { PriorityBadge, StatusBadge } from "@/components/pmms/status-badge";
import { slaApi } from "@/services/sla/sla-api";
import { reportsApi } from "@/services/reports/reports-api";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

const EMPTY = { from: "", to: "", property_id: "", category_id: "", priority: "", status: "" };

function formatClock(seconds) {
  if (seconds == null) return "—";
  const minutes = Math.round(Number(seconds) / 60);
  return `${minutes}m`;
}

export default function SlaReportPage() {
  const t = useT("common");
  const router = useRouter();
  const [filters, setFilters] = useState(EMPTY);
  const [report, setReport] = useState({ totals: {}, rows: [] });
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (next = filters) => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(next || {}).filter(([, value]) => value));
      const data = await slaApi.report(params);
      setReport(data || { totals: {}, rows: [] });
    } catch (error) {
      toast.error(apiError(error, t("sla_report_failed", { defaultMessage: "Failed to load SLA report" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    propertiesApi.list().then((data) => setProperties(Array.isArray(data) ? data : [])).catch(() => {});
    complaintsApi.categories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const totals = report.totals || {};
  const columns = [
    { accessorKey: "work_order_no", header: t("work_order", { defaultMessage: "Work order" }), cell: ({ row }) => (
      <button type="button" className="font-mono font-semibold text-violet-700" onClick={() => row.original.id && router.push(`/work-orders/${row.original.id}`)}>
        {row.original.work_order_no}
      </button>
    ) },
    { accessorKey: "property_name", header: t("property", { defaultMessage: "Property" }), cell: ({ row }) => row.original.property_name || "—" },
    { accessorKey: "category_name", header: t("category", { defaultMessage: "Category" }), cell: ({ row }) => row.original.category_name || "—" },
    { accessorKey: "priority", header: t("priority", { defaultMessage: "Priority" }), cell: ({ row }) => <PriorityBadge value={row.original.priority} /> },
    { accessorKey: "overall", header: t("sla", { defaultMessage: "SLA" }), cell: ({ row }) => <StatusBadge value={row.original.overall} /> },
    { id: "remaining", header: t("remaining", { defaultMessage: "Remaining" }), cell: ({ row }) => formatClock(row.original.measures?.find((item) => item.key === "resolution")?.remaining_seconds) },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Timer}
        title={t("sla_report", { defaultMessage: "SLA report" })}
        description={t("sla_report_desc", { defaultMessage: "Performance by property, category, priority, and status. Values match work-order timers." })}
        actions={
          <>
            <Button variant="outline" onClick={() => reportsApi.export("sla", "xlsx", Object.fromEntries(Object.entries(filters).filter(([, value]) => value)))}>{t("export_excel", { defaultMessage: "Excel" })}</Button>
            <Button variant="outline" onClick={() => reportsApi.export("sla", "pdf", Object.fromEntries(Object.entries(filters).filter(([, value]) => value)))}>{t("export_pdf", { defaultMessage: "PDF" })}</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title={t("rows", { defaultMessage: "Rows" })} value={totals.rows ?? 0} theme="indigo" icon={Timer} />
        <StatCard title={t("on_track", { defaultMessage: "On Track" })} value={totals.on_track ?? 0} theme="green" icon={Timer} />
        <StatCard title={t("at_risk", { defaultMessage: "At Risk" })} value={totals.at_risk ?? 0} theme="amber" icon={Timer} />
        <StatCard title={t("breached", { defaultMessage: "Breached" })} value={totals.breached ?? 0} theme="rose" icon={Timer} />
      </div>

      <section className="glass-panel grid gap-3 rounded-2xl p-5 md:grid-cols-4" aria-label={t("filters", { defaultMessage: "Filters" })}>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("from", { defaultMessage: "From" })}</span>
          <Input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("to", { defaultMessage: "To" })}</span>
          <Input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("property", { defaultMessage: "Property" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.property_id} onChange={(event) => setFilters((current) => ({ ...current, property_id: event.target.value }))}>
            <option value="">{t("all_properties", { defaultMessage: "All properties" })}</option>
            {properties.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("category", { defaultMessage: "Category" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.category_id} onChange={(event) => setFilters((current) => ({ ...current, category_id: event.target.value }))}>
            <option value="">{t("all_categories", { defaultMessage: "All categories" })}</option>
            {categories.map((row) => <option key={row.id} value={row.id}>{row.name_en}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("priority", { defaultMessage: "Priority" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
            <option value="">{t("all_priorities", { defaultMessage: "All priorities" })}</option>
            <option value="normal">{t("normal", { defaultMessage: "Normal" })}</option>
            <option value="urgent">{t("urgent", { defaultMessage: "Urgent" })}</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-500">{t("sla", { defaultMessage: "SLA" })}</span>
          <select className="h-10 w-full rounded-md border px-3 text-sm" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">{t("all_sla", { defaultMessage: "All SLA statuses" })}</option>
            <option value="on_track">{t("on_track", { defaultMessage: "On Track" })}</option>
            <option value="at_risk">{t("at_risk", { defaultMessage: "At Risk" })}</option>
            <option value="breached">{t("breached", { defaultMessage: "Breached" })}</option>
          </select>
        </label>
        <Button variant="outline" onClick={() => { setFilters(EMPTY); load(EMPTY); }}>{t("clear_filters", { defaultMessage: "Clear" })}</Button>
        <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => load(filters)}>{t("apply", { defaultMessage: "Apply" })}</Button>
      </section>

      <DataTable
        columns={columns}
        data={report.rows || []}
        isLoading={loading}
        columnsBtn={false}
        total={(report.rows || []).length}
      />
    </div>
  );
}
