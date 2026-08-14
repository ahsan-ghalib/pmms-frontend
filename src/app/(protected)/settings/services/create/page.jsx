"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import ServiceForm from "@/containers/settings/service-form";

export default function CreateServicePage() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: "Services", url: "/settings/services" },
        { name: "New service", url: "/settings/services/create" },
      ]} />
      <ServiceForm />
    </div>
  );
}
