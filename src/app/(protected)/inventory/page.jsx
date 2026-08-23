"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PartsTable from "@/containers/inventory/parts-table";
import { useT } from "@/lib/use-t";

export default function InventoryPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: t("inventory", { defaultMessage: "Inventory" }), url: "/inventory" }]} />
      <PartsTable />
    </div>
  );
}
