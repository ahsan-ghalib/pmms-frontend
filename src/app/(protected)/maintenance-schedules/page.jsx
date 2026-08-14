"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import MaintenanceSchedules from "@/containers/maintenance/maintenance-schedules";
import { useT } from "@/lib/use-t";

export default function MaintenanceSchedulesPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: t("pm_schedules", { defaultMessage: "Preventive Maintenance" }), url: "/maintenance-schedules" }]} />
      <MaintenanceSchedules />
    </div>
  );
}
