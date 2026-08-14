"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import CompanyForm from "@/containers/companies/company-form";

export default function CreateCompanyPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: "Companies", url: "/companies" }, { name: "Create", url: "/companies/create" }]} />
      <CompanyForm />
    </div>
  );
}
