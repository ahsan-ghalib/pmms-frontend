"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import CategoryForm from "@/containers/settings/category-form";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError } from "@/lib/pmms";

export default function EditCategoryPage() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);

  useEffect(() => {
    complaintsApi.category(id)
      .then(setCategory)
      .catch((error) => toast.error(apiError(error, "Failed to load category")));
  }, [id]);

  if (!category) return <div className="p-8 text-center text-muted-foreground">Loading category...</div>;

  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: "Categories", url: "/settings/categories" },
        { name: category.name_en, url: "#" },
      ]} />
      <CategoryForm category={category} />
    </div>
  );
}
