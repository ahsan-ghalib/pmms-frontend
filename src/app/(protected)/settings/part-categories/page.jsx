"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PartCategoriesPage from "@/containers/settings/part-categories-page";
import { useT } from "@/lib/use-t";

export default function PartCategoriesSettingsPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("settings", { defaultMessage: "Settings" }), url: "/settings/categories" },
        { name: t("part_categories", { defaultMessage: "Part categories" }), url: "/settings/part-categories" },
      ]} />
      <PartCategoriesPage />
    </div>
  );
}
