"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PurchaseRequestDetails from "@/containers/inventory/purchase-request-details";
import { useT } from "@/lib/use-t";

export default function PurchaseRequestDetailsPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("purchase_requests", { defaultMessage: "Purchase requests" }), url: "/inventory/purchase-requests" },
        { name: t("details", { defaultMessage: "Details" }), url: "#" },
      ]} />
      <PurchaseRequestDetails />
    </div>
  );
}
