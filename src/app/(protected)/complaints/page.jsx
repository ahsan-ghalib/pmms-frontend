"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PmmsComplaintsTable from "@/containers/complaints/pmms-complaints-table";
import { useT } from "@/lib/use-t";

export default function ComplaintsPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: t("complaints", { defaultMessage: "Complaints" }), url: "/complaints" }]} />
      <PmmsComplaintsTable />
    </div>
  );
}
