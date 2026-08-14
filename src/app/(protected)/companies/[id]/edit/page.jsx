"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import CompanyForm from "@/containers/companies/company-form";
import { companiesApi } from "@/services/companies/companies-api";
import { apiError } from "@/lib/pmms";

export default function EditCompanyPage() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    companiesApi.show(id)
      .then(setCompany)
      .catch((error) => toast.error(apiError(error, "Failed to load company")));
  }, [id]);

  if (!company) return <div className="p-8 text-center text-muted-foreground">Loading company...</div>;

  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: "Companies", url: "/companies" },
        { name: company.name, url: `/companies/${company.id}` },
        { name: "Edit", url: "#" },
      ]} />
      <CompanyForm company={company} />
    </div>
  );
}
