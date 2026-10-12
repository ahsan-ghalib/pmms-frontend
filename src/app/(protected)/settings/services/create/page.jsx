"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import SuperAdminOnly from "@/components/pmms/super-admin-only";
import ServiceForm from "@/containers/settings/service-form";

function CreateServicePageContent() {
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

export default function CreateServicePage() {
  return (
    <SuperAdminOnly redirectTo="/settings/categories">
      <CreateServicePageContent />
    </SuperAdminOnly>
  );
}
