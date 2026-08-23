"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import AssetCategoriesPage from "@/containers/settings/asset-categories-page";
import { useT } from "@/lib/use-t";

export default function AssetCategoriesSettingsPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("settings", { defaultMessage: "Settings" }), url: "/settings/categories" },
        { name: t("asset_categories", { defaultMessage: "Asset categories" }), url: "/settings/asset-categories" },
      ]} />
      <AssetCategoriesPage />
    </div>
  );
}
