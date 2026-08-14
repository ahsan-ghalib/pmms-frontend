"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import WorkingCalendarSettings from "@/containers/settings/working-calendar-settings";
import { useT } from "@/lib/use-t";

export default function WorkingCalendarPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("settings", { defaultMessage: "Settings" }), url: "/settings/working-calendar" },
        { name: t("sidebar_calendar", { defaultMessage: "Working Calendar" }), url: "/settings/working-calendar" },
      ]} />
      <WorkingCalendarSettings />
    </div>
  );
}
