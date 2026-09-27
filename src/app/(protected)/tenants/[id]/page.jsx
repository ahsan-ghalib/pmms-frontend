"use client";

import { useParams } from "next/navigation";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import TenantDetails from "@/containers/tenants/tenant-details";

export default function TenantDetailsPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: "Tenants", url: "/tenants" }, { name: "Details", url: `/tenants/${id}` }]} />
      <TenantDetails />
    </div>
  );
}
