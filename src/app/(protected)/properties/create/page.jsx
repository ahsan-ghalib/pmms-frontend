"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PropertyForm from "@/containers/properties/property-form";
import { useT } from "@/lib/use-t";

export default function CreatePropertyPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("properties", { defaultMessage: "Properties" }), url: "/properties" },
        { name: t("new_property", { defaultMessage: "New property" }), url: "/properties/create" },
      ]} />
      <PropertyForm />
    </div>
  );
}
