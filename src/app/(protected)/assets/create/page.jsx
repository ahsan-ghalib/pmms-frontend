"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import AssetForm from "@/containers/assets/asset-form";
import { useT } from "@/lib/use-t";

export default function CreateAssetPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("assets", { defaultMessage: "Assets" }), url: "/assets" },
        { name: t("new_asset", { defaultMessage: "New asset" }), url: "/assets/create" },
      ]} />
      <AssetForm />
    </div>
  );
}
