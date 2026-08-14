"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import WorkOrderForm from "@/containers/work-orders/work-order-form";

export default function CreateWorkOrderPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: "Work Orders", url: "/work-orders" }, { name: "Create", url: "/work-orders/create" }]} />
      <WorkOrderForm />
    </div>
  );
}
