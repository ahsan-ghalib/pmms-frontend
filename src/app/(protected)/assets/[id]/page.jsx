"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import AssetDetails from "@/containers/assets/asset-details";
import { useT } from "@/lib/use-t";

export default function AssetDetailsPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("assets", { defaultMessage: "Assets" }), url: "/assets" },
        { name: t("details", { defaultMessage: "Details" }), url: "#" },
      ]} />
      <AssetDetails />
    </div>
  );
}
