"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import CompaniesTable from "@/containers/companies/companies-table";
import { useT } from "@/lib/use-t";

export default function CompaniesPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: t("companies", { defaultMessage: "Companies" }), url: "/companies" }]} />
      <CompaniesTable />
    </div>
  );
}
