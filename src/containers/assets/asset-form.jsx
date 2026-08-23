"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField, SelectField, TextareaField, FileField } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import { companiesApi } from "@/services/companies/companies-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { assetsApi } from "@/services/assets/assets-api";
import { apiError, labelize } from "@/lib/pmms";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { useT } from "@/lib/use-t";

const FALLBACK_TYPES = ["hvac", "electrical", "mechanical", "plumbing", "lift", "fire_safety", "it", "furniture", "other"];
const FALLBACK_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "3_months", label: "3 Months" },
  { value: "6_months", label: "6 Months" },
  { value: "yearly", label: "Yearly" },
];

export default function AssetForm({ asset }) {
  const t = useT("common");
  const router = useRouter();
  const { data: session } = useSession();
  const isSuper = normalizeRole(session?.user?.role) === Roles.SUPER_ADMIN;
  const [companies, setCompanies] = useState([]);
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tree, setTree] = useState(null);
  const [options, setOptions] = useState({ types: FALLBACK_TYPES, frequencies: FALLBACK_FREQUENCIES });

  const { control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      company_id: asset?.company_id || "",
      category_id: asset?.category_id || "",
      subcategory_id: asset?.subcategory_id || "",
      property_id: asset?.property_id || "",
      location_id: asset?.location_id || "",
      unit_id: asset?.unit_id || "",
      name: asset?.name || "",
      type: asset?.type || "",
      brand: asset?.brand || "",
      model: asset?.model || "",
      serial_number: asset?.serial_number || "",
      purchase_date: asset?.purchase_date || "",
      installation_date: asset?.installation_date || "",
      maintenance_frequency: asset?.maintenance_frequency || "",
      next_maintenance_due_date: asset?.next_maintenance_due_date || "",
      notes: asset?.notes || "",
      "warranty.provider": asset?.warranty?.provider || "",
      "warranty.reference_no": asset?.warranty?.reference_no || "",
      "warranty.starts_on": asset?.warranty?.starts_on || "",
      "warranty.ends_on": asset?.warranty?.ends_on || "",
      "warranty.terms": asset?.warranty?.terms || "",
      photo: null,
    },
  });

  const propertyId = watch("property_id");
  const categoryId = watch("category_id");
  const subcategories = useMemo(
    () => (categories.find((row) => row.id === categoryId)?.subcategories || []).filter((row) => row.status === "active" || row.id === asset?.subcategory_id),
    [categories, categoryId, asset?.subcategory_id]
  );
  const locations = tree?.locations || [];
  const units = locations.flatMap((location) => (location.sub_locations || []).flatMap((sub) => sub.units || []));

  useEffect(() => {
    assetsApi.options().then((data) => {
      if (!data) return;
      setOptions({
        types: data.types?.length ? data.types : FALLBACK_TYPES,
        frequencies: data.frequencies?.length ? data.frequencies : FALLBACK_FREQUENCIES,
      });
    }).catch(() => {});
    assetsApi.categories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
    propertiesApi.list().then((data) => setProperties(Array.isArray(data) ? data.filter((row) => !row.archived_at) : [])).catch(() => {});
    if (isSuper) companiesApi.list().then((data) => setCompanies(Array.isArray(data) ? data.filter((row) => !row.archived_at) : [])).catch(() => {});
  }, [isSuper]);

  useEffect(() => {
    if (!propertyId) {
      setTree(null);
      return;
    }
    propertiesApi.tree(propertyId).then(setTree).catch(() => setTree(null));
  }, [propertyId]);

  const onSubmit = async (values) => {
    const photo = values.photo?.[0] || values.photo || null;
    const payload = {
      company_id: values.company_id || undefined,
      category_id: values.category_id,
      subcategory_id: values.subcategory_id || null,
      property_id: values.property_id,
      location_id: values.location_id || null,
      unit_id: values.unit_id || null,
      name: values.name,
      type: values.type || null,
      brand: values.brand || null,
      model: values.model || null,
      serial_number: values.serial_number || null,
      purchase_date: values.purchase_date || null,
      installation_date: values.installation_date || null,
      maintenance_frequency: values.maintenance_frequency || null,
      next_maintenance_due_date: values.next_maintenance_due_date || null,
      notes: values.notes || null,
      warranty: {
        provider: values["warranty.provider"] || null,
        reference_no: values["warranty.reference_no"] || null,
        starts_on: values["warranty.starts_on"] || null,
        ends_on: values["warranty.ends_on"] || null,
        terms: values["warranty.terms"] || null,
      },
    };

    try {
      const saved = asset
        ? await assetsApi.update(asset.id, payload)
        : await assetsApi.create(payload);
      if (photo instanceof File) {
        await assetsApi.uploadPhoto(saved.id, photo);
      }
      toast.success(asset ? t("asset_updated", { defaultMessage: "Asset updated" }) : t("asset_created", { defaultMessage: "Asset registered" }));
      router.push(saved?.id ? `/assets/${saved.id}` : "/assets");
    } catch (error) {
      toast.error(apiError(error, t("asset_save_failed", { defaultMessage: "Unable to save asset" })));
    }
  };

  const activeCategories = categories.filter((row) => row.status === "active" || row.id === asset?.category_id);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <PageHeader
        icon={Boxes}
        title={asset ? t("edit_asset", { defaultMessage: "Edit asset" }) : t("new_asset", { defaultMessage: "New asset" })}
        description={t("asset_form_desc", { defaultMessage: "Name, type, hierarchy, warranty, photo, and maintenance frequency. Codes are generated automatically." })}
      />

      <section className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("identity", { defaultMessage: "Identity" })}</p>
        </div>
        {isSuper && !asset && (
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
        <SelectField
          label={t("type", { defaultMessage: "Type" })}
          name="type"
          control={control}
          errors={errors}
          options={(options.types || []).map((type) => ({ value: type.value || type, label: type.label || labelize(type.value || type) }))}
        />
        <TextField label={t("brand", { defaultMessage: "Brand" })} name="brand" control={control} errors={errors} />
        <TextField label={t("model", { defaultMessage: "Model" })} name="model" control={control} errors={errors} />
        <TextField label={t("serial_number", { defaultMessage: "Serial number" })} name="serial_number" control={control} errors={errors} />
        <SelectField
          label={t("category", { defaultMessage: "Category" })}
          name="category_id"
          control={control}
          errors={errors}
          validation={{ required: t("required", { defaultMessage: "Required" }) }}
          options={activeCategories.map((row) => ({ value: row.id, label: row.status === "active" ? row.name_en : `${row.name_en} (inactive)` }))}
        />
        <SelectField
          label={t("subcategory", { defaultMessage: "Subcategory" })}
          name="subcategory_id"
          control={control}
          errors={errors}
          options={subcategories.map((row) => ({ value: row.id, label: row.name_en }))}
        />
        <FileField label={t("photo", { defaultMessage: "Photo" })} name="photo" control={control} errors={errors} accept="image/*" />
      </section>

      <section className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("hierarchy", { defaultMessage: "Hierarchy" })}</p>
        </div>
        <SelectField
          label={t("property", { defaultMessage: "Property" })}
          name="property_id"
          control={control}
          errors={errors}
          validation={{ required: t("required", { defaultMessage: "Required" }) }}
          options={properties.map((row) => ({ value: row.id, label: row.name }))}
        />
        <SelectField
          label={t("location", { defaultMessage: "Location" })}
          name="location_id"
          control={control}
          errors={errors}
          options={locations.map((row) => ({ value: row.id, label: row.name }))}
        />
        <SelectField
          label={t("unit", { defaultMessage: "Unit" })}
          name="unit_id"
          control={control}
          errors={errors}
          options={units.map((row) => ({ value: row.id, label: row.name || row.unit_no }))}
        />
      </section>

      <section className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("warranty", { defaultMessage: "Warranty" })}</p>
        </div>
        <TextField label={t("provider", { defaultMessage: "Provider" })} name="warranty.provider" control={control} errors={errors} />
        <TextField label={t("reference", { defaultMessage: "Reference" })} name="warranty.reference_no" control={control} errors={errors} />
        <TextField label={t("starts_on", { defaultMessage: "Starts on" })} name="warranty.starts_on" control={control} errors={errors} placeholder="YYYY-MM-DD" />
        <TextField label={t("ends_on", { defaultMessage: "Ends on" })} name="warranty.ends_on" control={control} errors={errors} placeholder="YYYY-MM-DD" />
        <div className="md:col-span-2">
          <TextareaField label={t("terms", { defaultMessage: "Terms" })} name="warranty.terms" control={control} errors={errors} />
        </div>
      </section>

      <section className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("maintenance", { defaultMessage: "Maintenance" })}</p>
        </div>
        <TextField label={t("purchase_date", { defaultMessage: "Purchase date" })} name="purchase_date" control={control} errors={errors} placeholder="YYYY-MM-DD" />
        <TextField label={t("installation_date", { defaultMessage: "Installation date" })} name="installation_date" control={control} errors={errors} placeholder="YYYY-MM-DD" />
        <SelectField
          label={t("maintenance_frequency", { defaultMessage: "Maintenance frequency" })}
          name="maintenance_frequency"
          control={control}
          errors={errors}
          options={(options.frequencies || []).map((item) => ({ value: item.value || item, label: item.label || labelize(item.value || item) }))}
        />
        <TextField label={t("next_due", { defaultMessage: "Next due date" })} name="next_maintenance_due_date" control={control} errors={errors} placeholder="YYYY-MM-DD" />
        <div className="md:col-span-2">
          <TextareaField label={t("notes", { defaultMessage: "Notes" })} name="notes" control={control} errors={errors} />
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>{t("cancel", { defaultMessage: "Cancel" })}</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">
          {asset ? t("save_changes", { defaultMessage: "Save changes" }) : t("register_asset", { defaultMessage: "Register asset" })}
        </Button>
      </div>
    </form>
  );
}
