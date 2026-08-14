"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PropertyForm from "@/containers/properties/property-form";
import { propertiesApi } from "@/services/properties/properties-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

export default function EditPropertyPage() {
  const { id } = useParams();
  const t = useT("common");
  const [property, setProperty] = useState(null);

  useEffect(() => {
    propertiesApi.show(id).then(setProperty).catch((error) => {
      toast.error(apiError(error, t("property_load_failed", { defaultMessage: "Failed to load property" })));
    });
  }, [id]);

  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("properties", { defaultMessage: "Properties" }), url: "/properties" },
        { name: property?.name || t("details", { defaultMessage: "Details" }), url: `/properties/${id}` },
        { name: t("edit", { defaultMessage: "Edit" }), url: `/properties/${id}/edit` },
      ]} />
      {property ? <PropertyForm property={property} /> : <div className="glass-panel h-48 animate-pulse rounded-2xl" />}
    </div>
  );
}
