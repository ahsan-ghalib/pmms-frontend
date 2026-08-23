"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PartDetails from "@/containers/inventory/part-details";
import { useT } from "@/lib/use-t";

export default function PartDetailsPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("inventory", { defaultMessage: "Inventory" }), url: "/inventory" },
        { name: t("details", { defaultMessage: "Details" }), url: "#" },
      ]} />
      <PartDetails />
    </div>
  );
}
