"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, SwitchField, TextField } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import { pmmsUsersApi } from "@/services/users/pmms-users-api";
import { companiesApi } from "@/services/companies/companies-api";
import { platformApi } from "@/services/platform/platform-api";
import { apiError } from "@/lib/pmms";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";

const ROLE_OPTIONS = [
  { value: "company-admin", label: "Company Admin" },
  { value: "property-manager", label: "Property Manager" },
  { value: "supervisor", label: "Supervisor" },
  { value: "technician", label: "Technician" },
  { value: "tenant", label: "Tenant" },
  { value: "vendor", label: "Vendor" },
];

export default function UserAccountForm({ user }) {
  const router = useRouter();
  const role = normalizeRole(useSession().data?.user?.role);
  const isSuper = role === Roles.SUPER_ADMIN;
  const [companies, setCompanies] = useState([]);
  const [languages, setLanguages] = useState([]);
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
    },
  });

  useEffect(() => {
    if (isSuper) {
      companiesApi.list().then((data) => setCompanies(Array.isArray(data) ? data : [])).catch(() => {});
    }
    platformApi.languages().then((data) => setLanguages(Array.isArray(data) ? data : [])).catch(() => {});
  }, [isSuper]);

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const payload = { ...values };
        if (!payload.password) delete payload.password;
        if (!isSuper) delete payload.company_id;
        if (payload.role === "super-admin") payload.company_id = null;
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
        description="Create a company account with a role, language, and optional property scope later."
      />
      <div className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <TextField label="Name" name="name" control={control} validation={{ required: "Required" }} />
        <TextField label="Email" name="email" control={control} validation={{ required: "Required" }} />
        <TextField label="Username" name="username" control={control} />
        <TextField label="Phone" name="phone" control={control} />
        <TextField label={user ? "Password (leave blank to keep)" : "Password"} name="password" type="password" control={control} validation={user ? {} : { required: "Required" }} />
        <SelectField
          label="Role"
          name="role"
          control={control}
          options={isSuper ? [{ value: "super-admin", label: "Super Admin" }, ...ROLE_OPTIONS] : ROLE_OPTIONS}
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
        <SelectField
          label="Status"
          name="status"
          control={control}
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "suspended", label: "Suspended" },
            { value: "deactivated", label: "Deactivated" },
          ]}
        />
        <div className="md:col-span-2">
          <SwitchField label="Can add co-workers on work orders" name="can_add_coworkers" control={control} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/users")}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-full bg-violet-600 hover:bg-violet-700">
          {user ? "Save changes" : "Create user"}
        </Button>
      </div>
    </form>
  );
}
