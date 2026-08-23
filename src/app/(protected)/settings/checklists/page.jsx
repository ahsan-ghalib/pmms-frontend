"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import ChecklistSettingsPage from "@/containers/checklists/checklist-settings-page";
import { useT } from "@/lib/use-t";

export default function ChecklistSettingsRoute() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("settings", { defaultMessage: "Settings" }), url: "/settings/categories" },
        { name: t("daily_checklists", { defaultMessage: "Daily checklists" }), url: "/settings/checklists" },
      ]} />
      <ChecklistSettingsPage />
    </div>
  );
}
