"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import WorkOrderDetails from "@/containers/work-orders/work-order-details";

export default function WorkOrderDetailsPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: "Work Orders", url: "/work-orders" }, { name: "Details", url: "#" }]} />
      <WorkOrderDetails />
    </div>
  );
}
