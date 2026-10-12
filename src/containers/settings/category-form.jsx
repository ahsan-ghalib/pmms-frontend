"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Layers3, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

export default function CategoryForm({ category }) {
  const t = useT("common");
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const { control, register, setValue, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name_en: category?.name_en || "",
      name_ar: category?.name_ar || "",
      code: category?.code || "",
      description: category?.description || "",
      status: category?.status || "active",
      icon_file: null,
      parent_id: category?.parent_id || "",
      sort_order: category?.sort_order ?? 0,
      color: category?.color || "#0EA5E9",
      background_file: null,
    },
  });
  const categoryName = watch("name_en");
  const generateCode = () => {
    const words = String(categoryName || "").trim().toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
    const code = words.length > 1 ? words.map((word) => word[0]).join("").slice(0, 8) : (words[0] || "").slice(0, 8);
    setValue("code", code, { shouldDirty: true, shouldValidate: true });
  };

  useEffect(() => {
    complaintsApi.categories({ scope: "master" }).then((data) => {
      setCategories((Array.isArray(data) ? data : []).filter((item) => item.id !== category?.id));
    }).catch(() => setCategories([]));
  }, [category?.id]);

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const payload = new FormData();
        Object.entries(values).forEach(([key, value]) => {
          if (key === "icon_file" || key === "background_file") { if (value?.[0]) payload.append(key, value[0]); return; }
          if (value !== undefined && value !== null && value !== "") payload.append(key, value);
        });
        payload.set("name_ar", values.name_ar || values.name_en);
        try {
          if (category) {
            await complaintsApi.updateCategory(category.id, payload);
            toast.success(t("category_updated", { defaultMessage: "Category updated" }));
          } else {
            await complaintsApi.createCategory(payload);
            toast.success(t("category_created", { defaultMessage: "Category created" }));
          }
          router.push("/settings/categories");
        } catch (error) {
          toast.error(apiError(error, t("category_save_failed", { defaultMessage: "Unable to save category" })));
        }
      })}
    >
      <PageHeader
        icon={Layers3}
        title={category ? t("edit_master_category", { defaultMessage: "Edit master category" }) : t("new_master_category", { defaultMessage: "New master category" })}
        description={t("master_category_form_desc", { defaultMessage: "Master categories are shared by all companies. Each company selects the ones it needs and sets its own rules." })}
      />

      <div className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <TextField label={t("name_en", { defaultMessage: "English name" })} name="name_en" control={control} errors={errors} validation={{ required: "Required" }} />
        <TextField label={t("name_ar", { defaultMessage: "Arabic name" })} name="name_ar" control={control} errors={errors} />
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <TextField label={t("code", { defaultMessage: "Code" })} name="code" control={control} errors={errors} validation={{ required: "Required" }} />
          </div>
          <Button type="button" variant="outline" className="mb-4 h-10 shrink-0" onClick={generateCode}>
            <WandSparkles className="mr-2 h-4 w-4" /> {t("generate_code", { defaultMessage: "Generate code" })}
          </Button>
        </div>
        <TextField label={t("sort_order", { defaultMessage: "Sort order" })} name="sort_order" type="number" control={control} errors={errors} />
        <SelectField
          label={t("parent_category", { defaultMessage: "Parent category" })}
          name="parent_id"
          control={control}
          errors={errors}
          placeholder={t("no_parent_category", { defaultMessage: "No parent category" })}
          options={categories.map((item) => ({ value: item.id, label: `${item.name_en}${item.name_ar ? ` · ${item.name_ar}` : ""}` }))}
        />
        <SelectField
          label={t("status", { defaultMessage: "Status" })}
          name="status"
          control={control}
          errors={errors}
          options={[
            { value: "active", label: t("active", { defaultMessage: "Active" }) },
            { value: "inactive", label: t("inactive", { defaultMessage: "Inactive" }) },
          ]}
        />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium">
            {t("category_icon", { defaultMessage: "Category icon" })}
            <input className="mt-2 block w-full rounded-lg border px-3 py-2 text-sm" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" {...register("icon_file")} />
          </label>
          <p className="mt-1 text-xs text-slate-500">{t("category_icon_hint", { defaultMessage: "PNG, JPG, SVG or WebP up to 2 MB." })}</p>
        </div>
        <div>
          <label className="block text-sm font-medium">
            {t("background_image", { defaultMessage: "Background image" })}
            <input className="mt-2 block w-full rounded-lg border px-3 py-2 text-sm" type="file" accept="image/png,image/jpeg,image/webp" {...register("background_file")} />
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium">
            {t("category_color", { defaultMessage: "Category color" })}
            <input className="mt-2 h-10 w-full rounded-lg border p-1" type="color" {...register("color")} />
          </label>
        </div>
        <div className="md:col-span-2">
          <TextField label={t("description", { defaultMessage: "Description" })} name="description" control={control} errors={errors} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/settings/categories")}>{t("cancel", { defaultMessage: "Cancel" })}</Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-full bg-violet-600 hover:bg-violet-700">
          {category ? t("save_changes", { defaultMessage: "Save changes" }) : t("create_category", { defaultMessage: "Create category" })}
        </Button>
      </div>
    </form>
  );
}
