"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import SuperAdminOnly from "@/components/pmms/super-admin-only";
import CategoryForm from "@/containers/settings/category-form";

function CreateCategoryPageContent() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: "Categories", url: "/settings/categories" },
        { name: "New category", url: "/settings/categories/create" },
      ]} />
      <CategoryForm />
    </div>
  );
}

export default function CreateCategoryPage() {
  return (
    <SuperAdminOnly redirectTo="/settings/categories">
      <CreateCategoryPageContent />
    </SuperAdminOnly>
  );
}
