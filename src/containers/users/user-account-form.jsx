"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneField, SelectField, SwitchField, TextField } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import { pmmsUsersApi } from "@/services/users/pmms-users-api";
import { companiesApi } from "@/services/companies/companies-api";
import { platformApi } from "@/services/platform/platform-api";
import { complaintsApi } from "@/services/complaints/complaints-api";
import { apiError, formatDate, labelize } from "@/lib/pmms";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/use-t";

const ROLE_OPTIONS = [
  { value: "company-admin", label: "Company Admin" },
  { value: "property-manager", label: "Property Manager" },
  { value: "supervisor", label: "Supervisor" },
  { value: "technician", label: "Technician" },
  { value: "vendor", label: "Vendor" },
];

function categoryLabel(category) {
  return category.name || category.name_en || category.code || "Category";
}

export default function UserAccountForm({ user }) {
  const t = useT("common");
  const router = useRouter();
  const sessionRole = normalizeRole(useSession().data?.user?.role);
  const isSuper = sessionRole === Roles.SUPER_ADMIN;
  const [companies, setCompanies] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      username: user?.username || "",
      phone: user?.phone || "",
      password: "",
      role: user?.role || "technician",
      company_id: user?.company_id || undefined,
      language: user?.language || "en",
      status: user?.status || "active",
      can_add_coworkers: Boolean(user?.can_add_coworkers),
      category_ids: user?.category_ids || (user?.categories || []).map((category) => category.id).filter(Boolean),
    },
  });
  const selectedRole = useWatch({ control, name: "role" });
  const selectedCompanyId = useWatch({ control, name: "company_id" });

  useEffect(() => {
    if (isSuper) {
      companiesApi.list().then((data) => setCompanies(Array.isArray(data) ? data : [])).catch(() => {});
    }
    platformApi.languages().then((data) => setLanguages(Array.isArray(data) ? data : [])).catch(() => {});
    pmmsUsersApi.roles().then((data) => setAvailableRoles(Array.isArray(data) ? data : [])).catch(() => {});
  }, [isSuper]);

  useEffect(() => {
    if (selectedRole !== "technician") {
      setCategories([]);
      return;
    }
    const params = { active_only: true };
    if (isSuper && selectedCompanyId) params.company_id = selectedCompanyId;
    if (isSuper && !selectedCompanyId) {
      setCategories([]);
      return;
    }
    complaintsApi.categories(params).then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => setCategories([]));
  }, [selectedRole, selectedCompanyId, isSuper]);

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const payload = { ...values };
        if (!payload.password) delete payload.password;
        if (!isSuper) delete payload.company_id;
        if (payload.role === "super-admin") payload.company_id = null;
        payload.category_ids = payload.role === "technician" ? (payload.category_ids || []) : [];
        try {
          if (user) {
            await pmmsUsersApi.update(user.id, payload);
            toast.success("User updated");
          } else {
            await pmmsUsersApi.create(payload);
            toast.success("User created");
          }
          router.push("/users");
        } catch (error) {
          toast.error(apiError(error, "Unable to save user"));
        }
      })}
    >
      <PageHeader
        icon={UserPlus}
        title={user ? "Edit user" : "New user"}
        description="Create staff accounts here. Tenants are registered separately under People → Tenants."
      />
      <div className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <TextField label="Name" name="name" control={control} validation={{ required: "Required" }} />
        <TextField label="Email" name="email" control={control} validation={{ required: "Required" }} />
        <TextField label="Username" name="username" control={control} />
        <Controller name="phone" control={control} render={({ field }) => <PhoneField {...field} label="Phone" defaultCountry={companies.find((company) => company.id === selectedCompanyId)?.country?.iso2 || "QA"} />} />
        <TextField label={user ? "Password (leave blank to keep)" : "Password"} name="password" type="password" control={control} validation={user ? {} : { required: "Required" }} />
        <SelectField
          label="Role"
          name="role"
          control={control}
          options={(availableRoles.length ? availableRoles : ROLE_OPTIONS).filter((role) => (role.value || role.name) !== "tenant").map((role) => ({ value: role.value || role.name, label: role.label || role.display_name || role.name }))}
        />
        {isSuper && (
          <SelectField
            label="Company"
            name="company_id"
            control={control}
            options={companies.map((company) => ({ value: company.id, label: company.name }))}
          />
        )}
        <SelectField
          label="Language"
          name="language"
          control={control}
          options={languages.map((language) => ({ value: language.code, label: language.name }))}
        />
        {!user && (
          <SelectField
            label="Initial status"
            name="status"
            control={control}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        )}
        {user && (
          <div className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10">
            <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
            <p className="mt-1 font-semibold">{user.status || "active"}</p>
            <p className="mt-1 text-xs text-slate-500">Change status from Users with a required reason. That action is recorded in history.</p>
          </div>
        )}
        <div className="md:col-span-2">
          <SwitchField label="Can add co-workers on work orders" name="can_add_coworkers" control={control} />
        </div>
        {selectedRole === "technician" && (
          <div className="md:col-span-2 space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
                {t("maintenance_categories", { defaultMessage: "Maintenance Categories" })}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {t("technician_categories_hint", { defaultMessage: "Assign one or more active company categories. Work orders and automatic assignment will only use these categories." })}
              </p>
            </div>
            {isSuper && !selectedCompanyId ? (
              <p className="text-sm text-slate-500">{t("select_company_first", { defaultMessage: "Select a company to see its active categories." })}</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-slate-500">{t("no_active_categories", { defaultMessage: "No active maintenance categories found for this company." })}</p>
            ) : (
              <Controller
                name="category_ids"
                control={control}
                render={({ field }) => (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {categories.map((category) => {
                      const checked = (field.value || []).includes(category.id);
                      return (
                        <label
                          key={category.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition",
                            checked
                              ? "border-violet-400 bg-violet-50/80 dark:border-violet-500/50 dark:bg-violet-500/10"
                              : "border-slate-200/80 bg-white/50 dark:border-white/10 dark:bg-white/5"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-violet-600"
                            checked={checked}
                            onChange={(event) => {
                              const current = field.value || [];
                              field.onChange(
                                event.target.checked
                                  ? [...current, category.id]
                                  : current.filter((id) => id !== category.id)
                              );
                            }}
                          />
                          <span className="font-medium text-slate-800 dark:text-slate-100">{categoryLabel(category)}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            )}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/users")}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-full bg-violet-600 hover:bg-violet-700">
          {user ? "Save changes" : "Create user"}
        </Button>
      </div>

      {user && (
        <section className="glass-panel rounded-2xl p-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">Status history</p>
          <div className="space-y-3">
            {(user.status_history || []).length === 0 && <p className="text-sm text-slate-500">No status changes recorded yet.</p>}
            {(user.status_history || []).map((event) => (
              <div key={event.id} className="rounded-xl border border-slate-100 px-3 py-2 text-sm dark:border-white/10">
                <div className="font-semibold">{labelize(event.from_status) || "—"} → {labelize(event.to_status)}</div>
                <div className="text-xs text-slate-500">
                  {formatDate(event.changed_at)}
                  {event.changed_by_name ? ` · ${event.changed_by_name}` : ""}
                  {event.reason ? ` · ${labelize(event.reason)}` : ""}
                </div>
                {event.remarks && <p className="mt-1 text-slate-600 dark:text-slate-300">{event.remarks}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </form>
  );
}
