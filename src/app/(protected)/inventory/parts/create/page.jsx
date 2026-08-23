"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PartForm from "@/containers/inventory/part-form";
import { useT } from "@/lib/use-t";

export default function CreatePartPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("inventory", { defaultMessage: "Inventory" }), url: "/inventory" },
        { name: t("new_part", { defaultMessage: "New part" }), url: "/inventory/parts/create" },
      ]} />
      <PartForm />
    </div>
  );
}
