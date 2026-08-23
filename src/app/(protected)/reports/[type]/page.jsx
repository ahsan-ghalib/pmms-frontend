"use client";

import { useParams } from "next/navigation";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import OpsReportPage from "@/containers/reports/ops-report-page";
import { useT } from "@/lib/use-t";

export default function OpsReportRoute() {
  const { type } = useParams();
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("reports", { defaultMessage: "Reports" }), url: "/reports" },
        { name: String(type || "").replaceAll("_", " "), url: `/reports/${type}` },
      ]} />
      <OpsReportPage type={type} />
    </div>
  );
}
