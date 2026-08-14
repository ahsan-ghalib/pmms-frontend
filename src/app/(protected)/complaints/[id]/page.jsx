"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PmmsComplaintDetails from "@/containers/complaints/pmms-complaint-details";

export default function ComplaintDetailsPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: "Complaints", url: "/complaints" }, { name: "Details", url: "#" }]} />
      <PmmsComplaintDetails />
    </div>
  );
}
