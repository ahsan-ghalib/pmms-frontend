"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Landmark, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField, SelectField } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import { companiesApi } from "@/services/companies/companies-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { apiError } from "@/lib/pmms";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { useT } from "@/lib/use-t";

const FALLBACK_TYPES = [
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
  { value: "office", label: "Office" },
  { value: "shopping_complex", label: "Shopping Complex" },
];

export default function PropertyForm({ property }) {
  const t = useT("common");
  const router = useRouter();
  const { data: session } = useSession();
  const [companies, setCompanies] = useState([]);
  const [types, setTypes] = useState([]);
  const isSuper = normalizeRole(session?.user?.role) === Roles.SUPER_ADMIN;

  const { control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      company_id: property?.company_id || "",
      name: property?.name || "",
      code: property?.code || "",
      type: property?.type || "villa",
      status: property?.status || "active",
      notes: property?.notes || "",
      contact_name: property?.contact?.name || "",
      contact_phone: property?.contact?.phone || "",
      contact_email: property?.contact?.email || "",
      latitude: property?.latitude ?? "",
      longitude: property?.longitude ?? "",
      "address.line_1": property?.address?.line_1 || "",
      "address.line_2": property?.address?.line_2 || "",
      "address.city": property?.address?.city || "",
      "address.state": property?.address?.state || "",
      "address.country": property?.address?.country || "Qatar",
      "address.postal_code": property?.address?.postal_code || "",
    },
  });

  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const mapsPreview = latitude !== "" && longitude !== "" && latitude != null && longitude != null
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : null;

  useEffect(() => {
    propertiesApi.types().then((data) => setTypes(Array.isArray(data) ? data : [])).catch(() => {});
    if (isSuper) companiesApi.list().then((data) => setCompanies(Array.isArray(data) ? data.filter((row) => !row.archived_at) : [])).catch(() => {});
  }, [isSuper]);

  const onSubmit = async (values) => {
    const payload = {
      company_id: values.company_id || undefined,
      name: values.name,
      code: values.code,
      type: values.type,
      status: values.status,
      notes: values.notes || null,
      contact_name: values.contact_name || null,
      contact_phone: values.contact_phone || null,
      contact_email: values.contact_email || null,
      latitude: values.latitude === "" || values.latitude == null ? null : Number(values.latitude),
      longitude: values.longitude === "" || values.longitude == null ? null : Number(values.longitude),
      address: {
        line_1: values["address.line_1"],
        line_2: values["address.line_2"] || null,
        city: values["address.city"] || null,
        state: values["address.state"] || null,
        country: values["address.country"] || null,
        postal_code: values["address.postal_code"] || null,
      },
    };

    try {
      if (property) {
        await propertiesApi.update(property.id, payload);
        toast.success(t("property_updated", { defaultMessage: "Property updated" }));
        router.push(`/properties/${property.id}`);
      } else {
        const created = await propertiesApi.create(payload);
        toast.success(t("property_created", { defaultMessage: "Property created" }));
        router.push(created?.id ? `/properties/${created.id}` : "/properties");
      }
    } catch (error) {
      toast.error(apiError(error, t("property_save_failed", { defaultMessage: "Unable to save property" })));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <PageHeader
        icon={Landmark}
        title={property ? t("edit_property", { defaultMessage: "Edit property" }) : t("new_property", { defaultMessage: "New property" })}
        description={t("property_form_desc", { defaultMessage: "Name, code, type, address, contact, and map pin. Codes must be unique inside the company." })}
      />

      <section className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("prop_identity", { defaultMessage: "Identity" })}</p>
          <p className="mt-1 text-sm text-slate-500">{t("prop_identity_desc", { defaultMessage: "Required fields. Duplicate codes in the same company are blocked." })}</p>
        </div>
        {isSuper && !property && (
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
        <TextField label={t("code", { defaultMessage: "Code" })} name="code" control={control} errors={errors} validation={{ required: t("required", { defaultMessage: "Required" }) }} />
        <SelectField
          label={t("type", { defaultMessage: "Type" })}
          name="type"
          control={control}
          errors={errors}
          options={types.length ? types : FALLBACK_TYPES}
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
      </section>

      <section className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("address", { defaultMessage: "Address" })}</p>
          <p className="mt-1 text-sm text-slate-500">{t("prop_address_desc", { defaultMessage: "Street address used on complaints, work orders, and navigation." })}</p>
        </div>
        <div className="md:col-span-2">
          <TextField label={t("address_line_1", { defaultMessage: "Address line 1" })} name="address.line_1" control={control} errors={errors} validation={{ required: t("required", { defaultMessage: "Required" }) }} />
        </div>
        <TextField label={t("address_line_2", { defaultMessage: "Address line 2" })} name="address.line_2" control={control} errors={errors} />
        <TextField label={t("city", { defaultMessage: "City" })} name="address.city" control={control} errors={errors} />
        <TextField label={t("state", { defaultMessage: "State" })} name="address.state" control={control} errors={errors} />
        <TextField label={t("country", { defaultMessage: "Country" })} name="address.country" control={control} errors={errors} />
        <TextField label={t("postal_code", { defaultMessage: "Postal code" })} name="address.postal_code" control={control} errors={errors} />
      </section>

      <section className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("contact", { defaultMessage: "Contact" })}</p>
          <p className="mt-1 text-sm text-slate-500">{t("prop_contact_desc", { defaultMessage: "Site contact for technicians and supervisors." })}</p>
        </div>
        <TextField label={t("contact_name", { defaultMessage: "Contact name" })} name="contact_name" control={control} errors={errors} />
        <TextField label={t("contact_phone", { defaultMessage: "Contact phone" })} name="contact_phone" control={control} errors={errors} />
        <div className="md:col-span-2">
          <TextField label={t("contact_email", { defaultMessage: "Contact email" })} name="contact_email" control={control} errors={errors} />
        </div>
      </section>

      <section className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("maps_pin", { defaultMessage: "Maps pin" })}</p>
          <p className="mt-1 text-sm text-slate-500">{t("prop_maps_desc", { defaultMessage: "Latitude and longitude are stored and opened with the same Google Maps link on web and mobile." })}</p>
        </div>
        <TextField label={t("latitude", { defaultMessage: "Latitude" })} name="latitude" control={control} errors={errors} />
        <TextField label={t("longitude", { defaultMessage: "Longitude" })} name="longitude" control={control} errors={errors} />
        <div className="md:col-span-2">
          {mapsPreview ? (
            <a href={mapsPreview} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:underline">
              <MapPin className="h-4 w-4" /> {t("open_maps", { defaultMessage: "Open maps" })}
            </a>
          ) : (
            <p className="text-sm text-slate-400">{t("prop_maps_empty", { defaultMessage: "Add coordinates to generate a navigation link." })}</p>
          )}
        </div>
      </section>

      <section className="glass-panel rounded-2xl p-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("notes", { defaultMessage: "Notes" })}</p>
        <TextField label={t("notes", { defaultMessage: "Notes" })} name="notes" control={control} errors={errors} />
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push(property ? `/properties/${property.id}` : "/properties")}>
          {t("cancel", { defaultMessage: "Cancel" })}
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">
          {property ? t("save_changes", { defaultMessage: "Save changes" }) : t("create_property", { defaultMessage: "Create property" })}
        </Button>
      </div>
    </form>
  );
}
