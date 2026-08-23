"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField, SelectField, FileField } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import { companiesApi } from "@/services/companies/companies-api";
import { inventoryApi } from "@/services/inventory/pmms-inventory-api";
import { apiError, labelize } from "@/lib/pmms";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";

const FALLBACK_TYPES = ["hvac", "electrical", "mechanical", "plumbing", "lift", "fire_safety", "it", "furniture", "other"];
const FALLBACK_UNITS = ["pcs", "box", "meter", "liter", "kg", "set"];

export default function PartForm({ part }) {
  const t = useT("common");
  const router = useRouter();
  const { data: session } = useSession();
  const isSuper = normalizeRole(session?.user?.role) === Roles.SUPER_ADMIN;
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [options, setOptions] = useState({ asset_types: FALLBACK_TYPES, units: FALLBACK_UNITS });

  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      company_id: part?.company_id || "",
      category_id: part?.category_id || "",
      name: part?.name || "",
      sku: part?.sku || "",
      unit_of_measure: part?.unit_of_measure || "pcs",
      minimum_stock: part?.minimum_stock ?? 0,
      status: part?.status || "active",
      asset_types: part?.asset_types || [],
      photo: null,
    },
  });

  const assetTypes = watch("asset_types") || [];

  useEffect(() => {
    inventoryApi.options().then((data) => {
      if (!data) return;
      setOptions({
        asset_types: data.asset_types?.length ? data.asset_types : FALLBACK_TYPES,
        units: data.units?.length ? data.units : FALLBACK_UNITS,
      });
    }).catch(() => {});
    inventoryApi.categories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
    if (isSuper) companiesApi.list().then((data) => setCompanies(Array.isArray(data) ? data.filter((row) => !row.archived_at) : [])).catch(() => {});
  }, [isSuper]);

  const onSubmit = async (values) => {
    const photo = values.photo?.[0] || values.photo || null;
    const payload = {
      company_id: values.company_id || undefined,
      category_id: values.category_id || null,
      name: values.name,
      sku: values.sku,
      unit_of_measure: values.unit_of_measure,
      minimum_stock: Number(values.minimum_stock || 0),
      status: values.status,
      asset_types: values.asset_types || [],
    };

    try {
      const saved = part
        ? await inventoryApi.updatePart(part.id, payload)
        : await inventoryApi.createPart(payload);
      if (photo instanceof File) {
        await inventoryApi.uploadPhoto(saved.id, photo);
      }
      toast.success(part ? t("part_updated", { defaultMessage: "Part updated" }) : t("part_created", { defaultMessage: "Part created" }));
      router.push(saved?.id ? `/inventory/parts/${saved.id}` : "/inventory");
    } catch (error) {
      toast.error(apiError(error, t("part_save_failed", { defaultMessage: "Unable to save part" })));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <PageHeader
        icon={Package}
        title={part ? t("edit_part", { defaultMessage: "Edit part" }) : t("new_part", { defaultMessage: "New part" })}
        description={t("part_form_desc", { defaultMessage: "Category, SKU, unit of measure, linked asset types, photo, and minimum stock." })}
      />

      <section className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("identity", { defaultMessage: "Identity" })}</p>
        </div>
        {isSuper && !part && (
          <div className="md:col-span-2">
            <SelectField
              label={t("company", { defaultMessage: "Company" })}
              name="company_id"
              control={control}
              errors={errors}
              validation={{ required: t("required", { defaultMessage: "Required" }) }}
              options={companies.map((company) => ({ value: company.id, label: company.name }))}
            />
          </div>
        )}
        <TextField label={t("name", { defaultMessage: "Name" })} name="name" control={control} errors={errors} validation={{ required: t("required", { defaultMessage: "Required" }) }} />
        <TextField label={t("sku", { defaultMessage: "SKU" })} name="sku" control={control} errors={errors} validation={{ required: t("required", { defaultMessage: "Required" }) }} />
        <SelectField
          label={t("category", { defaultMessage: "Category" })}
          name="category_id"
          control={control}
          errors={errors}
          options={categories.filter((row) => row.status === "active" || row.id === part?.category_id).map((row) => ({ value: row.id, label: row.name_en }))}
        />
        <SelectField
          label={t("uom", { defaultMessage: "Unit of measure" })}
          name="unit_of_measure"
          control={control}
          errors={errors}
          validation={{ required: t("required", { defaultMessage: "Required" }) }}
          options={options.units.map((unit) => ({ value: unit, label: unit }))}
        />
        <TextField label={t("min_stock", { defaultMessage: "Minimum stock" })} name="minimum_stock" type="number" control={control} errors={errors} />
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
        <div className="md:col-span-2 space-y-2">
          <p className="text-sm font-medium">{t("asset_types", { defaultMessage: "Linked asset types" })}</p>
          <div className="flex flex-wrap gap-2">
            {options.asset_types.map((type) => {
              const value = type.value || type;
              const selected = assetTypes.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue("asset_types", selected ? assetTypes.filter((item) => item !== value) : [...assetTypes, value])}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    selected ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                  )}
                >
                  {type.label || labelize(value)}
                </button>
              );
            })}
          </div>
        </div>
        <FileField label={t("photo", { defaultMessage: "Photo" })} name="photo" control={control} errors={errors} accept="image/*" />
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push(part?.id ? `/inventory/parts/${part.id}` : "/inventory")}>
          {t("cancel", { defaultMessage: "Cancel" })}
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">
          {part ? t("save", { defaultMessage: "Save" }) : t("create", { defaultMessage: "Create" })}
        </Button>
      </div>
    </form>
  );
}
