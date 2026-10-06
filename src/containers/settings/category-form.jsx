"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Layers3, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, SwitchField, TextField } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { companiesApi } from "@/services/companies/companies-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";

export default function CategoryForm({ category }) {
  const t = useT("common");
  const router = useRouter();
  const isSuper = normalizeRole(useSession().data?.user?.role) === Roles.SUPER_ADMIN;
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const { control, register, setValue, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name_en: category?.name_en || "",
      name_ar: category?.name_ar || "",
      code: category?.code || "",
      description: category?.description || "",
      capacity: category?.capacity ?? 5,
      reopen_window_hours: category?.reopen_window_hours ?? "",
      status: category?.status || "active",
      visible_to_tenant: category?.visible_to_tenant ?? true,
      icon_file: null,
      normal_priority_enabled: category?.normal_priority_enabled ?? true,
      urgent_priority_enabled: category?.urgent_priority_enabled ?? true,
      tenant_reopen_enabled: category?.tenant_reopen_enabled ?? true,
      admin_reopen_enabled: category?.admin_reopen_enabled ?? true,
      admin_reopen_window_hours: category?.admin_reopen_window_hours ?? "",
      company_id: category?.company_id || undefined,
      parent_id: category?.parent_id || "",
      sort_order: category?.sort_order ?? 0,
      color: category?.color || "#0EA5E9",
      background_file: null,
    },
  });
  const categoryName = watch("name_en");
  const selectedCompanyId = watch("company_id");
  const generateCode = () => {
    const words = String(categoryName || "").trim().toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
    const code = words.length > 1 ? words.map((word) => word[0]).join("").slice(0, 8) : (words[0] || "").slice(0, 8);
    setValue("code", code, { shouldDirty: true, shouldValidate: true });
  };

  useEffect(() => {
    if (isSuper) companiesApi.list().then((data) => setCompanies(Array.isArray(data) ? data : [])).catch(() => {});
  }, [isSuper]);

  useEffect(() => {
    const companyId = isSuper ? selectedCompanyId : undefined;
    complaintsApi.categories(companyId ? { company_id: companyId } : {}).then((data) => {
      setCategories((Array.isArray(data) ? data : []).filter((item) => item.id !== category?.id));
    }).catch(() => setCategories([]));
  }, [isSuper, selectedCompanyId, category?.id]);

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const payload = new FormData();
        Object.entries(values).forEach(([key, value]) => {
          if (!isSuper && key === "company_id") return;
          if (key === "icon_file" || key === "background_file") { if (value?.[0]) payload.append(key, value[0]); return; }
          if (value !== undefined && value !== null && value !== "") payload.append(key, typeof value === "boolean" ? (value ? "1" : "0") : value);
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
        title={category ? t("edit_category", { defaultMessage: "Edit category" }) : t("new_category", { defaultMessage: "New category" })}
        description={t("category_form_desc", { defaultMessage: "A category groups related services for complaints and work orders." })}
      />

      <div className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        {isSuper && !category && (
          <div className="md:col-span-2">
            <SelectField
              label={t("company", { defaultMessage: "Company" })}
              name="company_id"
              control={control}
              errors={errors}
              validation={{ required: "Required" }}
              options={companies.map((company) => ({ value: company.id, label: company.name }))}
            />
          </div>
        )}
        <TextField label={t("name_en", { defaultMessage: "English name" })} name="name_en" control={control} errors={errors} validation={{ required: "Required" }} />
        <TextField label={t("name_ar", { defaultMessage: "Arabic name" })} name="name_ar" control={control} errors={errors} />
        <div className="flex items-end gap-2"><div className="min-w-0 flex-1"><TextField label={t("code", { defaultMessage: "Code" })} name="code" control={control} errors={errors} validation={{ required: "Required" }} /></div><Button type="button" variant="outline" className="mb-4 h-10 shrink-0" onClick={generateCode}><WandSparkles className="mr-2 h-4 w-4" /> Generate Code</Button></div>
        <TextField label={t("capacity", { defaultMessage: "Daily capacity" })} name="capacity" control={control} errors={errors} />
        <TextField label="Sort order" name="sort_order" type="number" control={control} errors={errors} />
        <SelectField
          label="Parent category"
          name="parent_id"
          control={control}
          errors={errors}
          placeholder="No parent category"
          options={categories.map((item) => ({ value: item.id, label: `${item.name_en}${item.name_ar ? ` · ${item.name_ar}` : ""}` }))}
        />
        <TextField label={t("reopen_window", { defaultMessage: "Reopen window (hours)" })} name="reopen_window_hours" control={control} errors={errors} />
        <div className="md:col-span-2"><label className="block text-sm font-medium">Category Icon<input className="mt-2 block w-full rounded-lg border px-3 py-2 text-sm" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" {...register("icon_file")} /></label><p className="mt-1 text-xs text-slate-500">PNG, JPG, SVG or WebP up to 2 MB.</p></div>
        <div><label className="block text-sm font-medium">Background image<input className="mt-2 block w-full rounded-lg border px-3 py-2 text-sm" type="file" accept="image/png,image/jpeg,image/webp" {...register("background_file")} /></label></div>
        <div><label className="block text-sm font-medium">Category color<input className="mt-2 h-10 w-full rounded-lg border p-1" type="color" {...register("color")} /></label></div>
        <TextField label="Admin/Supervisor reopen window (hours)" name="admin_reopen_window_hours" control={control} errors={errors} />
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
          <SwitchField
            label={t("visible_to_tenant", { defaultMessage: "Visible to Tenant" })}
            description={t("visible_to_tenant_desc", { defaultMessage: "When disabled, tenants cannot select this category." })}
            name="visible_to_tenant"
            control={control}
            errors={errors}
          />
        </div>
        <SwitchField label="Normal Priority" name="normal_priority_enabled" control={control} errors={errors} />
        <SwitchField label="Urgent Priority" name="urgent_priority_enabled" control={control} errors={errors} />
        <SwitchField label="Tenant Reopen" description="Uses the Reopen Window Hours above." name="tenant_reopen_enabled" control={control} errors={errors} />
        <SwitchField label="Admin/Supervisor Reopen" name="admin_reopen_enabled" control={control} errors={errors} />
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
