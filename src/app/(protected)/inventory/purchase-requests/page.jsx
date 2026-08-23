"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PurchaseRequestsTable from "@/containers/inventory/purchase-requests-table";
import { useT } from "@/lib/use-t";

export default function PurchaseRequestsPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("inventory", { defaultMessage: "Inventory" }), url: "/inventory" },
        { name: t("purchase_requests", { defaultMessage: "Purchase requests" }), url: "/inventory/purchase-requests" },
      ]} />
      <PurchaseRequestsTable />
    </div>
  );
}
