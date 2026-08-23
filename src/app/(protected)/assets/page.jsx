"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import AssetsTable from "@/containers/assets/assets-table";
import { useT } from "@/lib/use-t";

export default function AssetsPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: t("assets", { defaultMessage: "Assets" }), url: "/assets" }]} />
      <AssetsTable />
    </div>
  );
}
