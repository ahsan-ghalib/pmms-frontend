"use client";

import { useParams } from "next/navigation";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import ChecklistExecutionPage from "@/containers/checklists/checklist-execution-page";
import { useT } from "@/lib/use-t";

export default function ChecklistDetailRoute() {
  const t = useT("common");
  const { id } = useParams();
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("daily_checklists", { defaultMessage: "Daily checklists" }), url: "/checklists" },
        { name: t("checklist", { defaultMessage: "Checklist" }), url: `/checklists/${id}` },
      ]} />
      <ChecklistExecutionPage id={id} />
    </div>
  );
}
