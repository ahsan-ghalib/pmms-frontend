"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import CompanyDetails from "@/containers/companies/company-details";

export default function CompanyDetailsPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: "Companies", url: "/companies" }, { name: "Details", url: "#" }]} />
      <CompanyDetails />
    </div>
  );
}
