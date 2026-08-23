"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import ChecklistsPage from "@/containers/checklists/checklists-page";
import { useT } from "@/lib/use-t";

export default function ChecklistsRoute() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: t("daily_checklists", { defaultMessage: "Daily checklists" }), url: "/checklists" }]} />
      <ChecklistsPage />
    </div>
  );
}
