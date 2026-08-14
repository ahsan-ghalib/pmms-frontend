"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import CategoriesPage from "@/containers/settings/categories-page";
import { useT } from "@/lib/use-t";

export default function CategoriesSettingsPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("settings", { defaultMessage: "Settings" }), url: "/settings/categories" },
        { name: t("categories", { defaultMessage: "Categories" }), url: "/settings/categories" },
      ]} />
      <CategoriesPage />
    </div>
  );
}
