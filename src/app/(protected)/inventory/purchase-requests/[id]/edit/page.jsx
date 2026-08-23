"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PurchaseRequestForm from "@/containers/inventory/purchase-request-form";
import { inventoryApi } from "@/services/inventory/pmms-inventory-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

export default function EditPurchaseRequestPage() {
  const { id } = useParams();
  const t = useT("common");
  const [pr, setPr] = useState(null);

  useEffect(() => {
    inventoryApi.showPurchaseRequest(id).then(setPr).catch((error) => {
      toast.error(apiError(error, t("pr_load_failed", { defaultMessage: "Failed to load purchase request" })));
    });
  }, [id]);

  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("purchase_requests", { defaultMessage: "Purchase requests" }), url: "/inventory/purchase-requests" },
        { name: pr?.pr_number || t("details", { defaultMessage: "Details" }), url: `/inventory/purchase-requests/${id}` },
        { name: t("edit", { defaultMessage: "Edit" }), url: `/inventory/purchase-requests/${id}/edit` },
      ]} />
      {pr ? <PurchaseRequestForm purchaseRequest={pr} /> : <div className="glass-panel h-48 animate-pulse rounded-2xl" />}
    </div>
  );
}
