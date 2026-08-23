"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileBarChart } from "lucide-react";
import PageHeader from "@/components/pmms/page-header";
import { reportsApi } from "@/services/reports/reports-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useLocaleContext } from "@/providers/locale-provider";

export default function ReportsCataloguePage() {
  const t = useT("common");
  const router = useRouter();
  const { locale } = useLocaleContext();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    reportsApi.catalogue()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((error) => toast.error(apiError(error, t("reports_load_failed", { defaultMessage: "Failed to load reports" }))));
  }, [t]);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={FileBarChart}
        title={t("reports", { defaultMessage: "Reports" })}
        description={t("reports_desc", { defaultMessage: "Scoped operational reports with documented definitions. Export any report to Excel or PDF." })}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <button
            key={row.key}
            type="button"
            onClick={() => router.push(row.key === "sla" ? "/reports/sla" : `/reports/${row.key}`)}
            className="glass-panel rounded-2xl p-5 text-start hover:bg-violet-50/60"
          >
            <p className="font-semibold">{locale === "ar" ? row.label_ar : row.label}</p>
            <p className="mt-2 text-sm text-slate-500">{locale === "ar" ? row.definition_ar : row.definition}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
