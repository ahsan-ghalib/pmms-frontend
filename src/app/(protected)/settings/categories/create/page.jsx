"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import CategoryForm from "@/containers/settings/category-form";

export default function CreateCategoryPage() {
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
