"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import TenantForm from "@/containers/tenants/tenant-form";

export default function CreateTenantPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: "Tenants", url: "/tenants" }, { name: "New tenant", url: "/tenants/create" }]} />
      <TenantForm />
    </div>
  );
}
