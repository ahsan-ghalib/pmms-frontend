"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PurchaseRequestForm from "@/containers/inventory/purchase-request-form";
import { useT } from "@/lib/use-t";

export default function CreatePurchaseRequestPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("purchase_requests", { defaultMessage: "Purchase requests" }), url: "/inventory/purchase-requests" },
        { name: t("new_pr", { defaultMessage: "New PR" }), url: "/inventory/purchase-requests/create" },
      ]} />
      <PurchaseRequestForm />
    </div>
  );
}
