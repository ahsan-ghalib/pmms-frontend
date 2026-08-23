"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import ReportsCataloguePage from "@/containers/reports/reports-catalogue-page";
import { useT } from "@/lib/use-t";

export default function ReportsRoute() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: t("reports", { defaultMessage: "Reports" }), url: "/reports" }]} />
      <ReportsCataloguePage />
    </div>
  );
}
