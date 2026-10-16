"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import SuperAdminOnly from "@/components/pmms/super-admin-only";
import InvoiceForm from "@/containers/billing/invoice-form";
import { billingApi } from "@/services/billing/billing-api";
import { apiError } from "@/lib/pmms";

export default function EditInvoicePage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    billingApi.invoice(id)
      .then(setInvoice)
      .catch((error) => toast.error(apiError(error, "Failed to load invoice")));
  }, [id]);

  return (
    <SuperAdminOnly redirectTo="/dashboard">
      <div className="space-y-6">
        <BreadcrumbComponent data={[
          { name: "Invoices", url: "/billing/invoices" },
          { name: "Edit draft", url: "#" },
        ]} />
        {invoice ? <InvoiceForm invoice={invoice} /> : <div className="p-8 text-center text-muted-foreground">Loading invoice...</div>}
      </div>
    </SuperAdminOnly>
  );
}
