"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import WorkOrdersTable from "@/containers/work-orders/work-orders-table";
import { useT } from "@/lib/use-t";

export default function WorkOrdersPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: t("work_orders", { defaultMessage: "Work Orders" }), url: "/work-orders" }]} />
      <WorkOrdersTable />
    </div>
  );
}
