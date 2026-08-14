"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import ServiceForm from "@/containers/settings/service-form";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError } from "@/lib/pmms";

export default function EditServicePage() {
  const { id } = useParams();
  const [service, setService] = useState(null);

  useEffect(() => {
    complaintsApi.service(id)
      .then(setService)
      .catch((error) => toast.error(apiError(error, "Failed to load service")));
  }, [id]);

  if (!service) return <div className="p-8 text-center text-muted-foreground">Loading service...</div>;

  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: "Services", url: "/settings/services" },
        { name: service.name_en, url: "#" },
      ]} />
      <ServiceForm service={service} />
    </div>
  );
}
