"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import TrialsPage from "@/containers/platform/trials-page";

export default function TrialsRoutePage() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: "Trials", url: "/trials" }]} />
      <TrialsPage />
    </div>
  );
}
