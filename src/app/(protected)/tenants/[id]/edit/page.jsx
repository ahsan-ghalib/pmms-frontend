"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import TenantForm from "@/containers/tenants/tenant-form";
import { tenantsApi } from "@/services/tenants/tenants-api";
import { apiError } from "@/lib/pmms";

export default function EditTenantPage() {
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    tenantsApi.show(id).then(setTenant).catch((error) => toast.error(apiError(error, "Failed to load tenant")));
  }, [id]);

  if (!tenant) return <div className="p-8 text-center text-muted-foreground">Loading tenant...</div>;

  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: "Tenants", url: "/tenants" }, { name: tenant.name, url: `/tenants/${tenant.id}` }, { name: "Edit", url: "#" }]} />
      <TenantForm tenant={tenant} />
    </div>
  );
}
