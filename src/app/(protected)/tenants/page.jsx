"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import TenantsTable from "@/containers/tenants/tenants-table";
import { useT } from "@/lib/use-t";

export default function TenantsPage() {
  const t = useT("common");

  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: t("tenants", { defaultMessage: "Tenants" }), url: "/tenants" }]} />
      <TenantsTable />
    </div>
  );
}
