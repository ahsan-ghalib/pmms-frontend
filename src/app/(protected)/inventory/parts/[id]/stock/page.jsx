"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PartStockForm from "@/containers/inventory/part-stock-form";
import { useT } from "@/lib/use-t";

export default function PartStockPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("inventory", { defaultMessage: "Inventory" }), url: "/inventory" },
        { name: t("manage_stock", { defaultMessage: "Manage stock" }), url: "#" },
      ]} />
      <PartStockForm />
    </div>
  );
}
