"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SwitchField, TextField } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import PlanFeaturePicker from "@/containers/platform/plan-feature-picker";
import { platformApi } from "@/services/platform/platform-api";
import { BILLING_CURRENCIES, BILLING_CYCLES, apiError, currencyDecimals, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

function initialPrices(plan) {
  const map = {};
  (plan?.prices || []).forEach((row) => {
    map[`${row.currency}:${row.billing_cycle}`] = String(row.amount);
  });
  return map;
}

function PlanPriceMatrix({ value, onChange, t }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
          {t("standard_pricing", { defaultMessage: "Standard pricing" })}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("standard_pricing_desc", { defaultMessage: "Leave a cell empty when the plan is not sold in that currency or cycle. Changing prices never changes existing invoices." })}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
              <th className="py-2 pr-4 font-medium">{t("currency", { defaultMessage: "Currency" })}</th>
              {BILLING_CYCLES.map((cycle) => (
                <th key={cycle} className="py-2 pr-4 font-medium">{t(`cycle_${cycle}`, { defaultMessage: labelize(cycle) })}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BILLING_CURRENCIES.map((currency) => (
              <tr key={currency} className="border-t border-slate-100 dark:border-white/5">
                <td className="py-2 pr-4 font-mono font-semibold text-slate-700 dark:text-slate-200">{currency}</td>
                {BILLING_CYCLES.map((cycle) => {
                  const key = `${currency}:${cycle}`;
                  return (
                    <td key={cycle} className="py-2 pr-4">
                      <Input
                        type="number"
                        min="0"
                        step={currencyDecimals(currency) === 3 ? "0.001" : "0.01"}
                        placeholder="—"
                        value={value[key] ?? ""}
                        onChange={(event) => onChange({ ...value, [key]: event.target.value })}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PlanForm({ plan }) {
  const t = useT("common");
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [prices, setPrices] = useState(() => initialPrices(plan));
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
          prices: Object.entries(prices)
            .filter(([, amount]) => amount !== "" && amount != null)
            .map(([key, amount]) => {
              const [currency, billing_cycle] = key.split(":");
              return { currency, billing_cycle, amount: Number(amount) };
            }),
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
        <PlanPriceMatrix value={prices} onChange={setPrices} t={t} />
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
