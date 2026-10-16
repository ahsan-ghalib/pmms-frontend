"use client";

import { useParams } from "next/navigation";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import SuperAdminOnly from "@/components/pmms/super-admin-only";
import InvoiceDetail from "@/containers/billing/invoice-detail";

export default function InvoiceDetailPage() {
  const { id } = useParams();

  return (
    <SuperAdminOnly redirectTo="/dashboard">
      <div className="space-y-6">
        <BreadcrumbComponent data={[
          { name: "Invoices", url: "/billing/invoices" },
          { name: "Invoice", url: "#" },
        ]} />
        <InvoiceDetail id={id} />
      </div>
    </SuperAdminOnly>
  );
}
