"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PropertiesTable from "@/containers/properties/properties-table";
import { useT } from "@/lib/use-t";

export default function PropertiesPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: t("properties", { defaultMessage: "Properties" }), url: "/properties" }]} />
      <PropertiesTable />
    </div>
  );
}
