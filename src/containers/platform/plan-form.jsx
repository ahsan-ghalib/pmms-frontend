"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SwitchField, TextField } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import PlanFeaturePicker from "@/containers/platform/plan-feature-picker";
import { platformApi } from "@/services/platform/platform-api";
import { apiError } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

export default function PlanForm({ plan }) {
  const t = useT("common");
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: plan?.name || "",
      description: plan?.description || "",
      max_users: plan?.max_users ?? "",
      max_properties: plan?.max_properties ?? "",
      max_storage_mb: plan?.max_storage_mb ?? "",
      features: Array.isArray(plan?.features) ? plan.features : [],
      is_active: plan ? Boolean(plan.is_active) : true,
    },
  });

  useEffect(() => {
    platformApi.planFeatures()
      .then((data) => setGroups(Array.isArray(data?.groups) ? data.groups : []))
      .catch((error) => toast.error(apiError(error, "Failed to load features")));
  }, []);

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const payload = {
          ...values,
          max_users: values.max_users === "" ? null : Number(values.max_users),
          max_properties: values.max_properties === "" ? null : Number(values.max_properties),
          max_storage_mb: values.max_storage_mb === "" ? null : Number(values.max_storage_mb),
          features: values.features || [],
        };
        try {
          if (plan) {
            await platformApi.updatePlan(plan.id, payload);
            toast.success(t("plan_updated", { defaultMessage: "Plan updated" }));
          } else {
            await platformApi.createPlan(payload);
            toast.success(t("plan_created", { defaultMessage: "Plan created" }));
          }
          router.push("/subscriptions?tab=plans");
        } catch (error) {
          toast.error(apiError(error, t("plan_save_failed", { defaultMessage: "Unable to save plan" })));
        }
      })}
    >
      <PageHeader
        icon={Layers3}
        title={plan ? t("edit_plan", { defaultMessage: "Edit plan" }) : t("new_plan", { defaultMessage: "New plan" })}
        description={t("plan_form_desc", { defaultMessage: "Limits and feature pack companies subscribe to." })}
      />

      <div className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <TextField label={t("plan_name", { defaultMessage: "Plan name" })} name="name" control={control} validation={{ required: "Required" }} />
        </div>
        <div className="md:col-span-2">
          <TextField label={t("description", { defaultMessage: "Description" })} name="description" control={control} />
        </div>
        <TextField label={t("max_users", { defaultMessage: "Max users" })} name="max_users" control={control} />
        <TextField label={t("max_properties", { defaultMessage: "Max properties" })} name="max_properties" control={control} />
        <TextField label={t("max_storage_mb", { defaultMessage: "Max storage (MB)" })} name="max_storage_mb" control={control} />
        <SwitchField
          label={t("active", { defaultMessage: "Active" })}
          description={t("plan_active_desc", { defaultMessage: "Inactive plans stay on existing subscriptions but cannot be newly assigned." })}
          name="is_active"
          control={control}
        />
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <Controller
          name="features"
          control={control}
          render={({ field }) => (
            <PlanFeaturePicker groups={groups} value={field.value || []} onChange={field.onChange} />
          )}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/subscriptions?tab=plans")}>
          {t("cancel", { defaultMessage: "Cancel" })}
        </Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-full bg-violet-600 hover:bg-violet-700">
          {plan ? t("save_changes", { defaultMessage: "Save changes" }) : t("create_plan", { defaultMessage: "Create plan" })}
        </Button>
      </div>
    </form>
  );
}
