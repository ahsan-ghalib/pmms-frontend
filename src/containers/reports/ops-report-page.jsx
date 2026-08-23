"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import OpsFilters from "@/components/pmms/ops-filters";
import { reportsApi } from "@/services/reports/reports-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { pmmsUsersApi } from "@/services/users/pmms-users-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

export default function OpsReportPage({ type }) {
  const t = useT("common");
  const [filters, setFilters] = useState({});
  const [report, setReport] = useState({ columns: [], rows: [], totals: {}, definition: "" });
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (next = filters) => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(next || {}).filter(([, value]) => value));
      setReport(await reportsApi.show(type, params) || { columns: [], rows: [] });
    } catch (error) {
      toast.error(apiError(error, t("report_failed", { defaultMessage: "Failed to load report" })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({});
    propertiesApi.list().then((data) => setProperties(Array.isArray(data) ? data : [])).catch(() => {});
    complaintsApi.categories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
    pmmsUsersApi.list({ role: "technician" }).then((data) => setTechnicians(Array.isArray(data) ? data : [])).catch(() => {});
  }, [type]);

  const columns = (report.columns || []).map((column) => ({
    accessorKey: column.key,
    header: column.label,
    cell: ({ row }) => row.original[column.key] ?? "—",
  }));

  const download = async (format) => {
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      await reportsApi.export(type, format, params);
    } catch (error) {
      toast.error(apiError(error, t("export_failed", { defaultMessage: "Export failed" })));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={FileBarChart}
        title={report.label || type.replaceAll("_", " ")}
        description={report.definition || t("report_desc", { defaultMessage: "Filter combinations stay scoped to your role." })}
        actions={
          <>
            <Button variant="outline" onClick={() => download("xlsx")}>{t("export_excel", { defaultMessage: "Excel" })}</Button>
            <Button variant="outline" onClick={() => download("pdf")}>{t("export_pdf", { defaultMessage: "PDF" })}</Button>
          </>
        }
      />
      {report.generated_at && <p className="text-xs text-slate-500">{t("generated_at", { defaultMessage: "Generated" })} {report.generated_at}</p>}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title={t("rows", { defaultMessage: "Rows" })} value={report.totals?.rows ?? 0} theme="indigo" icon={FileBarChart} />
      </div>
      <OpsFilters
        filters={filters}
        setFilters={setFilters}
        onApply={(next) => load(next || {})}
        properties={properties}
        categories={categories}
        services={categories.find((row) => row.id === filters.category_id)?.services || []}
        technicians={technicians}
        statuses={["created", "assigned", "in_progress", "on_hold", "completed", "submitted", "closed", "draft"]}
      />
      <DataTable columns={columns} data={report.rows || []} isLoading={loading} columnsBtn={false} total={(report.rows || []).length} />
    </div>
  );
}
