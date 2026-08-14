"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PmmsComplaintForm from "@/containers/complaints/pmms-complaint-form";

export default function CreateComplaintPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: "Complaints", url: "/complaints" }, { name: "Create", url: "/complaints/create" }]} />
      <PmmsComplaintForm />
    </div>
  );
}
