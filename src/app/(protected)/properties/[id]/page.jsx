"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PropertyDetails from "@/containers/properties/property-details";
import { useT } from "@/lib/use-t";

export default function PropertyDetailsPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("properties", { defaultMessage: "Properties" }), url: "/properties" },
        { name: t("details", { defaultMessage: "Details" }), url: "#" },
      ]} />
      <PropertyDetails />
    </div>
  );
}
