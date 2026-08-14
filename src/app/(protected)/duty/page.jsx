"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import DutyPage from "@/containers/technicians/duty-page";
import { useT } from "@/lib/use-t";

export default function DutyRoutePage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: t("duty_title", { defaultMessage: "Duty & my jobs" }), url: "/duty" }]} />
      <DutyPage />
    </div>
  );
}
