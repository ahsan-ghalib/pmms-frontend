"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PartForm from "@/containers/inventory/part-form";
import { inventoryApi } from "@/services/inventory/pmms-inventory-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

export default function EditPartPage() {
  const { id } = useParams();
  const t = useT("common");
  const [part, setPart] = useState(null);

  useEffect(() => {
    inventoryApi.showPart(id).then(setPart).catch((error) => {
      toast.error(apiError(error, t("part_load_failed", { defaultMessage: "Failed to load part" })));
    });
  }, [id]);

  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("inventory", { defaultMessage: "Inventory" }), url: "/inventory" },
        { name: part?.name || t("details", { defaultMessage: "Details" }), url: `/inventory/parts/${id}` },
        { name: t("edit", { defaultMessage: "Edit" }), url: `/inventory/parts/${id}/edit` },
      ]} />
      {part ? <PartForm part={part} /> : <div className="glass-panel h-48 animate-pulse rounded-2xl" />}
    </div>
  );
}
