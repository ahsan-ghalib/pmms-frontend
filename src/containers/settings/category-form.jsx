"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/form-fields";
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
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name_en: category?.name_en || "",
      name_ar: category?.name_ar || "",
      code: category?.code || "",
      description: category?.description || "",
      capacity: category?.capacity ?? 5,
      reopen_window_hours: category?.reopen_window_hours ?? "",
      status: category?.status || "active",
      company_id: category?.company_id || undefined,
    },
  });

  useEffect(() => {
    if (isSuper) {
      companiesApi.list().then((data) => setCompanies(Array.isArray(data) ? data : [])).catch(() => {});
    }
  }, [isSuper]);

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const payload = {
          ...values,
          name_ar: values.name_ar || values.name_en,
          capacity: values.capacity === "" ? null : Number(values.capacity),
          reopen_window_hours: values.reopen_window_hours === "" ? null : Number(values.reopen_window_hours),
        };
        if (!isSuper) delete payload.company_id;
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
        <TextField label={t("code", { defaultMessage: "Code" })} name="code" control={control} errors={errors} validation={{ required: "Required" }} />
        <TextField label={t("capacity", { defaultMessage: "Daily capacity" })} name="capacity" control={control} errors={errors} />
        <TextField label={t("reopen_window", { defaultMessage: "Reopen window (hours)" })} name="reopen_window_hours" control={control} errors={errors} />
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
