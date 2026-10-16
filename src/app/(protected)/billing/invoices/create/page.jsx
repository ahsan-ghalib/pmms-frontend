"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import SuperAdminOnly from "@/components/pmms/super-admin-only";
import InvoiceForm from "@/containers/billing/invoice-form";

function CreateInvoice() {
  const companyId = useSearchParams().get("company") || "";
  return <InvoiceForm initialCompanyId={companyId} />;
}

export default function CreateInvoicePage() {
  return (
    <SuperAdminOnly redirectTo="/dashboard">
      <div className="space-y-6">
        <BreadcrumbComponent data={[
          { name: "Invoices", url: "/billing/invoices" },
          { name: "New", url: "#" },
        ]} />
        <Suspense fallback={null}>
          <CreateInvoice />
        </Suspense>
      </div>
    </SuperAdminOnly>
  );
}
