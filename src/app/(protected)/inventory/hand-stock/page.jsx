"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import TechnicianHandStock from "@/containers/inventory/technician-hand-stock";
import { useT } from "@/lib/use-t";

export default function TechnicianHandStockPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("inventory", { defaultMessage: "Inventory" }), url: "/inventory" },
        { name: t("technician_hand_stock", { defaultMessage: "Technician hand stock" }), url: "/inventory/hand-stock" },
      ]} />
      <TechnicianHandStock />
    </div>
  );
}
