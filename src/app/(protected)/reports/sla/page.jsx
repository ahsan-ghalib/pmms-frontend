"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import SlaReportPage from "@/containers/reports/sla-report-page";
import { useT } from "@/lib/use-t";

export default function SlaReportRoute() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("sla_report", { defaultMessage: "SLA report" }), url: "/reports/sla" },
      ]} />
      <SlaReportPage />
    </div>
  );
}
