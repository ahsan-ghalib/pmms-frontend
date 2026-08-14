"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, CreditCard, Timer, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, SwitchField, TextField } from "@/components/form-fields";
import { companiesApi } from "@/services/companies/companies-api";
import { platformApi } from "@/services/platform/platform-api";
import { apiError } from "@/lib/pmms";
import PageHeader from "@/components/pmms/page-header";
import { StatusBadge } from "@/components/pmms/status-badge";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";

const TIMEZONES = [
  { value: "Asia/Qatar", label: "Asia/Qatar — Doha" },
  { value: "Asia/Riyadh", label: "Asia/Riyadh — KSA" },
  { value: "Asia/Dubai", label: "Asia/Dubai — UAE" },
  { value: "Asia/Kuwait", label: "Asia/Kuwait" },
  { value: "Asia/Bahrain", label: "Asia/Bahrain" },
  { value: "Asia/Muscat", label: "Asia/Muscat — Oman" },
  { value: "UTC", label: "UTC" },
];

function limitLabel(value) {
  return value == null || value === "" ? "∞" : value;
}

export default function CompanyForm({ company }) {
  const t = useT("common");
  const router = useRouter();
  const isEdit = Boolean(company);
  const [languages, setLanguages] = useState([]);
  const [plans, setPlans] = useState([]);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: company?.name || "",
      legal_name: company?.legal_name || "",
      code: company?.code || "",
      email: company?.email || "",
      phone: company?.phone || "",
      address: company?.address || "",
      timezone: company?.timezone || "Asia/Qatar",
      status: company?.status || "active",
      default_language_id: company?.default_language_id || undefined,
      access_type: "trial",
      subscription_plan_id: undefined,
      subscription_starts_at: "",
      subscription_ends_at: "",
      auto_renew: false,
      admin_name: "",
      admin_email: "",
      admin_phone: "",
      admin_password: "",
    },
  });
  const accessType = useWatch({ control, name: "access_type" });
  const selectedPlanId = useWatch({ control, name: "subscription_plan_id" });

  useEffect(() => {
    platformApi.languages().then((data) => setLanguages(Array.isArray(data) ? data : [])).catch(() => {});
    if (!isEdit) {
      platformApi.plans().then((data) => setPlans(Array.isArray(data) ? data.filter((plan) => plan.is_active) : [])).catch(() => {});
    }
  }, [isEdit]);

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      legal_name: values.legal_name || null,
      code: values.code,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      timezone: values.timezone,
      status: values.status,
      default_language_id: values.default_language_id || null,
    };

    if (!isEdit) {
      payload.access_type = values.access_type;
      if (values.access_type === "subscription") {
        payload.subscription_plan_id = values.subscription_plan_id;
        payload.subscription_starts_at = values.subscription_starts_at ? new Date(values.subscription_starts_at).toISOString() : undefined;
        payload.subscription_ends_at = values.subscription_ends_at ? new Date(values.subscription_ends_at).toISOString() : null;
        payload.auto_renew = Boolean(values.auto_renew);
      }
      payload.admin = {
        name: values.admin_name,
        email: values.admin_email,
        phone: values.admin_phone || null,
        password: values.admin_password,
      };
    }

    try {
      if (isEdit) {
        await companiesApi.update(company.id, payload);
        toast.success(t("company_updated", { defaultMessage: "Company updated" }));
        router.push(`/companies/${company.id}`);
      } else {
        const created = await companiesApi.create(payload);
        toast.success(t("company_created", { defaultMessage: "Company created" }));
        router.push(`/companies/${created?.id || ""}`);
      }
    } catch (error) {
      toast.error(apiError(error, t("company_save_failed", { defaultMessage: "Unable to save company" })));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <PageHeader
        icon={Building2}
        title={isEdit ? t("edit_company", { defaultMessage: "Edit company" }) : t("new_company", { defaultMessage: "New company" })}
        description={t("company_form_desc", { defaultMessage: "Company profile, access (trial or plan), and the first company admin." })}
      />

      <section className="glass-panel space-y-4 rounded-2xl p-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
            {t("company_details", { defaultMessage: "Company details" })}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {t("company_details_desc", { defaultMessage: "Identity, contact, timezone, and language for this tenant." })}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label={t("name", { defaultMessage: "Name" })} name="name" control={control} errors={errors} validation={{ required: "Required" }} />
          <TextField label={t("legal_name", { defaultMessage: "Legal name" })} name="legal_name" control={control} errors={errors} />
          <TextField label={t("code", { defaultMessage: "Code" })} name="code" control={control} errors={errors} validation={{ required: "Required" }} />
          <TextField label={t("email", { defaultMessage: "Email" })} name="email" control={control} errors={errors} />
          <TextField label={t("phone", { defaultMessage: "Phone" })} name="phone" control={control} errors={errors} />
          <SelectField label={t("timezone", { defaultMessage: "Timezone" })} name="timezone" control={control} errors={errors} options={TIMEZONES} />
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
          <SelectField
            label={t("default_language", { defaultMessage: "Default language" })}
            name="default_language_id"
            control={control}
            errors={errors}
            options={languages.map((language) => ({ value: language.id, label: language.name }))}
          />
          <div className="md:col-span-2">
            <TextField label={t("address", { defaultMessage: "Address" })} name="address" control={control} errors={errors} />
          </div>
        </div>
      </section>

      {!isEdit && (
        <>
          <section className="glass-panel space-y-4 rounded-2xl p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
                {t("access", { defaultMessage: "Access" })}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                {t("access_desc", { defaultMessage: "Start this company on a trial or assign a paid plan now." })}
              </h2>
            </div>
            <Controller
              name="access_type"
              control={control}
              render={({ field }) => (
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { id: "trial", icon: Timer, title: t("start_trial", { defaultMessage: "Start a trial" }), desc: t("start_trial_desc", { defaultMessage: "Uses the platform default trial length." }) },
                    { id: "subscription", icon: CreditCard, title: t("assign_paid_plan", { defaultMessage: "Assign a paid plan" }), desc: t("assign_paid_plan_desc", { defaultMessage: "Pick a plan and convert any future trial automatically." }) },
                    { id: "none", icon: Building2, title: t("access_later", { defaultMessage: "Set access later" }), desc: t("access_later_desc", { defaultMessage: "Create the company only. Assign a plan from Subscriptions." }) },
                  ].map((option) => {
                    const Icon = option.icon;
                    const active = field.value === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => field.onChange(option.id)}
                        className={cn(
                          "rounded-2xl border p-4 text-left transition",
                          active
                            ? "border-violet-400 bg-violet-50/80 ring-2 ring-violet-500 dark:border-violet-500/50 dark:bg-violet-500/10"
                            : "border-slate-200/80 bg-white/40 hover:border-violet-200 dark:border-white/10 dark:bg-white/5"
                        )}
                      >
                        <Icon className="h-5 w-5 text-violet-600" />
                        <p className="mt-2 font-semibold text-slate-900 dark:text-white">{option.title}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{option.desc}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            />

            {accessType === "subscription" && (
              <div className="space-y-4">
                <Controller
                  name="subscription_plan_id"
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field, fieldState }) => (
                    <div className="space-y-3">
                      <div className="grid gap-3 lg:grid-cols-3">
                        {plans.map((plan) => (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => field.onChange(plan.id)}
                            className={cn(
                              "rounded-2xl border p-4 text-left transition",
                              field.value === plan.id && "ring-2 ring-violet-500",
                              "border-slate-200/80 bg-white/50 dark:border-white/10 dark:bg-white/5"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
                              <StatusBadge value={plan.is_active ? "active" : "inactive"} />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{plan.description || "—"}</p>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                              <div><p className="font-semibold">{limitLabel(plan.max_users)}</p><p className="text-slate-400">{t("users", { defaultMessage: "Users" })}</p></div>
                              <div><p className="font-semibold">{limitLabel(plan.max_properties)}</p><p className="text-slate-400">{t("properties", { defaultMessage: "Properties" })}</p></div>
                              <div><p className="font-semibold">{plan.feature_count || 0}</p><p className="text-slate-400">{t("features", { defaultMessage: "Features" })}</p></div>
                            </div>
                          </button>
                        ))}
                      </div>
                      {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label={t("starts", { defaultMessage: "Starts" })} name="subscription_starts_at" type="datetime-local" control={control} />
                  <TextField label={t("ends", { defaultMessage: "Ends" })} name="subscription_ends_at" type="datetime-local" control={control} />
                  <div className="md:col-span-2">
                    <SwitchField label={t("auto_renew", { defaultMessage: "Auto renew" })} name="auto_renew" control={control} />
                  </div>
                </div>
                {selectedPlanId && (
                  <p className="text-sm text-slate-500">
                    {t("selected_plan", { defaultMessage: "Selected plan" })}: {plans.find((plan) => plan.id === selectedPlanId)?.name}
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="glass-panel space-y-4 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
                  {t("company_admin", { defaultMessage: "Company admin" })}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {t("company_admin_desc", { defaultMessage: "This user can sign in and manage the company portal." })}
                </h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label={t("admin_name", { defaultMessage: "Admin name" })} name="admin_name" control={control} errors={errors} validation={{ required: "Required" }} />
              <TextField label={t("admin_email", { defaultMessage: "Admin email" })} name="admin_email" control={control} errors={errors} validation={{ required: "Required" }} />
              <TextField label={t("admin_phone", { defaultMessage: "Admin phone" })} name="admin_phone" control={control} errors={errors} />
              <TextField label={t("admin_password", { defaultMessage: "Admin password" })} name="admin_password" type="password" control={control} errors={errors} validation={{ required: "Required", minLength: { value: 8, message: "Min 8 characters" } }} />
            </div>
          </section>
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push(isEdit ? `/companies/${company.id}` : "/companies")}>
          {t("cancel", { defaultMessage: "Cancel" })}
        </Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-full bg-violet-600 hover:bg-violet-700">
          {isEdit ? t("save_changes", { defaultMessage: "Save changes" }) : t("create_company", { defaultMessage: "Create company" })}
        </Button>
      </div>
    </form>
  );
}
