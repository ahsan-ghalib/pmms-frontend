"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileField, SelectField, SwitchField, TextField } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import { tenantsApi } from "@/services/tenants/tenants-api";
import { companiesApi } from "@/services/companies/companies-api";
import { propertiesApi } from "@/services/properties/properties-api";
import { apiError } from "@/lib/pmms";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { useT } from "@/lib/use-t";

export default function TenantForm({ tenant }) {
  const t = useT("common");
  const router = useRouter();
  const role = normalizeRole(useSession().data?.user?.role);
  const isSuper = role === Roles.SUPER_ADMIN;
  const [companies, setCompanies] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tree, setTree] = useState(null);
  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      company_id: tenant?.company_id || "",
      name: tenant?.name || "",
      nationality: tenant?.nationality || "",
      email: tenant?.email || "",
      phone: tenant?.phone || "",
      password: "",
      property_id: tenant?.assignment?.property_id || "",
      location_id: tenant?.assignment?.location_id || "",
      sub_location_id: tenant?.assignment?.sub_location_id || "",
      unit_id: tenant?.assignment?.unit_id || "",
      contract_no: tenant?.contract_no || "",
      contract_start_date: tenant?.contract_start_date || "",
      contract_end_date: tenant?.contract_end_date || "",
      rent_value: tenant?.rent_value || "",
      status: tenant?.status || "active",
      send_login_details: !tenant,
      contract_file: null,
      profile_picture: null,
    },
  });

  const propertyId = watch("property_id");
  const locationId = watch("location_id");
  const subLocationId = watch("sub_location_id");

  const locations = tree?.locations || [];
  const subLocations = useMemo(
    () => locations.find((row) => row.id === locationId)?.sub_locations || [],
    [locations, locationId]
  );
  const units = useMemo(
    () => subLocations.find((row) => row.id === subLocationId)?.units || [],
    [subLocations, subLocationId]
  );

  useEffect(() => {
    propertiesApi.list().then((data) => setProperties(Array.isArray(data) ? data : [])).catch(() => {});
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
    const payload = { ...values };
    if (tenant && !payload.password) delete payload.password;
    if (!isSuper) delete payload.company_id;
    try {
      if (tenant) {
        await tenantsApi.update(tenant.id, payload);
        toast.success(t("tenant_updated", { defaultMessage: "Tenant updated" }));
        router.push(`/tenants/${tenant.id}`);
      } else {
        const created = await tenantsApi.create(payload);
        toast.success(t("tenant_created", { defaultMessage: "Tenant created" }));
        router.push(created?.id ? `/tenants/${created.id}` : "/tenants");
      }
    } catch (error) {
      toast.error(apiError(error, t("tenant_save_failed", { defaultMessage: "Unable to save tenant" })));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <PageHeader
        icon={UserRound}
        title={tenant ? t("edit_tenant", { defaultMessage: "Edit tenant" }) : t("new_tenant", { defaultMessage: "New tenant" })}
        description={t("tenant_form_desc", { defaultMessage: "Create the tenant account and assign the rented unit. The tenant cannot change this assignment." })}
      />

      <section className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("tenant_identity", { defaultMessage: "Tenant" })}</p>
        </div>
        {isSuper && (
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
        <TextField label={t("tenant_name", { defaultMessage: "Tenant name" })} name="name" control={control} errors={errors} validation={{ required: t("required", { defaultMessage: "Required" }) }} />
        <TextField label={t("nationality", { defaultMessage: "Nationality" })} name="nationality" control={control} errors={errors} validation={{ required: t("required", { defaultMessage: "Required" }) }} />
        <TextField label={t("email", { defaultMessage: "Email address" })} name="email" control={control} errors={errors} validation={{ required: t("required", { defaultMessage: "Required" }) }} />
        <TextField label={t("mobile", { defaultMessage: "Mobile number" })} name="phone" control={control} errors={errors} validation={{ required: t("required", { defaultMessage: "Required" }) }} />
        <TextField
          label={tenant ? t("password_optional", { defaultMessage: "Password (leave blank to keep)" }) : t("password", { defaultMessage: "Password" })}
          name="password"
          type="password"
          control={control}
          errors={errors}
          validation={tenant ? {} : { required: t("required", { defaultMessage: "Required" }) }}
        />
        <SelectField
          label={t("tenant_status", { defaultMessage: "Tenant account status" })}
          name="status"
          control={control}
          errors={errors}
          options={[
            { value: "active", label: t("active", { defaultMessage: "Active" }) },
            { value: "inactive", label: t("inactive", { defaultMessage: "Inactive" }) },
          ]}
        />
        <FileField label={t("profile_picture", { defaultMessage: "Profile picture" })} name="profile_picture" control={control} errors={errors} accept="image/*" />
      </section>

      <section className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("rented_unit", { defaultMessage: "Rented unit" })}</p>
          <p className="mt-1 text-sm text-slate-500">{t("rented_unit_desc", { defaultMessage: "Assigned by Management. The tenant cannot select or change this unit." })}</p>
        </div>
        <SelectField
          label={t("property", { defaultMessage: "Property" })}
          name="property_id"
          control={control}
          errors={errors}
          validation={{ required: t("required", { defaultMessage: "Required" }) }}
          options={properties.map((item) => ({ value: item.id, label: item.name }))}
          onValueChange={() => {
            setValue("location_id", "");
            setValue("sub_location_id", "");
            setValue("unit_id", "");
          }}
        />
        <SelectField
          label={t("location", { defaultMessage: "Location" })}
          name="location_id"
          control={control}
          errors={errors}
          options={locations.map((item) => ({ value: item.id, label: item.name }))}
          onValueChange={() => {
            setValue("sub_location_id", "");
            setValue("unit_id", "");
          }}
        />
        <SelectField
          label={t("sub_location", { defaultMessage: "Sub-location" })}
          name="sub_location_id"
          control={control}
          errors={errors}
          options={subLocations.map((item) => ({ value: item.id, label: item.name }))}
          onValueChange={() => setValue("unit_id", "")}
        />
        <SelectField
          label={t("unit_villa", { defaultMessage: "Unit / Villa number" })}
          name="unit_id"
          control={control}
          errors={errors}
          validation={{ required: t("required", { defaultMessage: "Required" }) }}
          options={units.map((item) => ({ value: item.id, label: item.code ? `${item.name} (${item.code})` : item.name }))}
        />
      </section>

      <section className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">{t("contract", { defaultMessage: "Contract" })}</p>
        </div>
        <TextField label={t("contract_no", { defaultMessage: "Contract no" })} name="contract_no" control={control} errors={errors} validation={{ required: t("required", { defaultMessage: "Required" }) }} />
        <TextField label={t("rent_value", { defaultMessage: "Rent value" })} name="rent_value" control={control} errors={errors} />
        <TextField label={t("contract_start", { defaultMessage: "Contract start date" })} name="contract_start_date" type="date" control={control} errors={errors} validation={{ required: t("required", { defaultMessage: "Required" }) }} />
        <TextField label={t("contract_end", { defaultMessage: "Contract end date" })} name="contract_end_date" type="date" control={control} errors={errors} validation={{ required: t("required", { defaultMessage: "Required" }) }} />
        <div className="md:col-span-2">
          <FileField label={t("contract_file", { defaultMessage: "Contract file" })} name="contract_file" control={control} errors={errors} accept=".pdf,image/*" />
        </div>
      </section>

      <SwitchField
        label={t("send_login_details", { defaultMessage: "Send login details by email" })}
        description={t("send_login_details_desc", { defaultMessage: "Email the tenant their login, app download links, and access instructions." })}
        name="send_login_details"
        control={control}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push(tenant ? `/tenants/${tenant.id}` : "/tenants")}>
          {t("cancel", { defaultMessage: "Cancel" })}
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">
          {tenant ? t("save_changes", { defaultMessage: "Save changes" }) : t("create_tenant", { defaultMessage: "Create tenant" })}
        </Button>
      </div>
    </form>
  );
}
