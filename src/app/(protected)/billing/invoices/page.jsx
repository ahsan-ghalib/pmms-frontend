"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import SuperAdminOnly from "@/components/pmms/super-admin-only";
import InvoicesPage from "@/containers/billing/invoices-page";

export default function InvoicesRoutePage() {
  return (
    <SuperAdminOnly redirectTo="/dashboard">
      <div className="space-y-6">
        <BreadcrumbComponent data={[{ name: "Invoices", url: "/billing/invoices" }]} />
        <InvoicesPage />
      </div>
    </SuperAdminOnly>
  );
}
