"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

export default function ServiceForm({ service }) {
  const t = useT("common");
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      category_id: service?.category_id || undefined,
      name_en: service?.name_en || "",
      name_ar: service?.name_ar || "",
      code: service?.code || "",
      description: service?.description || "",
      status: service?.status || "active",
    },
  });

  useEffect(() => {
    complaintsApi.categories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const payload = {
          ...values,
          name_ar: values.name_ar || values.name_en,
        };
        try {
          if (service) {
            await complaintsApi.updateService(service.id, payload);
            toast.success(t("service_updated", { defaultMessage: "Service updated" }));
          } else {
            await complaintsApi.createService(values.category_id, payload);
            toast.success(t("service_created", { defaultMessage: "Service created" }));
          }
          router.push("/settings/services");
        } catch (error) {
          toast.error(apiError(error, t("service_save_failed", { defaultMessage: "Unable to save service" })));
        }
      })}
    >
      <PageHeader
        icon={Wrench}
        title={service ? t("edit_service", { defaultMessage: "Edit service" }) : t("new_service", { defaultMessage: "New service" })}
        description={t("service_form_desc", { defaultMessage: "A service sits under one category and is selected on complaints and jobs." })}
      />

      <div className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          {service ? (
            <div className="rounded-xl bg-slate-100/80 px-4 py-3 text-sm dark:bg-white/5">
              <p className="text-xs uppercase tracking-wide text-slate-500">{t("category", { defaultMessage: "Category" })}</p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">{service.category_name || "—"}</p>
            </div>
          ) : (
            <SelectField
              label={t("category", { defaultMessage: "Category" })}
              name="category_id"
              control={control}
              errors={errors}
              validation={{ required: "Required" }}
              options={categories.map((category) => ({ value: category.id, label: `${category.name_en} (${category.code})` }))}
            />
          )}
        </div>
        <TextField label={t("name_en", { defaultMessage: "English name" })} name="name_en" control={control} errors={errors} validation={{ required: "Required" }} />
        <TextField label={t("name_ar", { defaultMessage: "Arabic name" })} name="name_ar" control={control} errors={errors} />
        <TextField label={t("code", { defaultMessage: "Code" })} name="code" control={control} errors={errors} validation={{ required: "Required" }} />
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
        <Button type="button" variant="outline" onClick={() => router.push("/settings/services")}>{t("cancel", { defaultMessage: "Cancel" })}</Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-full bg-violet-600 hover:bg-violet-700">
          {service ? t("save_changes", { defaultMessage: "Save changes" }) : t("create_service", { defaultMessage: "Create service" })}
        </Button>
      </div>
    </form>
  );
}
