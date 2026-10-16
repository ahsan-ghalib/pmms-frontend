"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, SwitchField, TextField } from "@/components/form-fields";
import PageHeader from "@/components/pmms/page-header";
import { FeatureChecklist } from "@/containers/platform/plan-feature-picker";
import { StatusBadge } from "@/components/pmms/status-badge";
import { platformApi } from "@/services/platform/platform-api";
import { companiesApi } from "@/services/companies/companies-api";
import { BILLING_CURRENCIES, BILLING_CYCLES, apiError, currencyDecimals, formatMoney, labelize } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";

function limitLabel(value) {
  return value == null || value === "" ? "∞" : value;
}

function round(value, currency) {
  const factor = 10 ** currencyDecimals(currency);
  return Math.round((Number(value) || 0) * factor) / factor;
}

function planPrice(plan, currency, cycle) {
  const row = (plan?.prices || []).find((price) => price.currency === currency && price.billing_cycle === cycle);
  return row ? Number(row.amount) : null;
}

function pricingPreview({ plan, currency, cycle, customPrice, discountType, discountValue, taxRate }) {
  const standard = planPrice(plan, currency, cycle);
  const base = customPrice !== "" && customPrice != null ? Number(customPrice) : standard;
  const value = Number(discountValue) || 0;
  let discount = 0;
  if (discountType === "percent") discount = ((base || 0) * Math.min(value, 100)) / 100;
  if (discountType === "fixed") discount = Math.min(value, base || 0);
  discount = round(discount, currency);
  const net = round((base || 0) - discount, currency);
  const tax = round((net * (Number(taxRate) || 0)) / 100, currency);
  return { standard, base, discount, net, tax, total: round(net + tax, currency) };
}

export default function SubscriptionForm({ subscription }) {
  const t = useT("common");
  const router = useRouter();
  const [companies, setCompanies] = useState([]);
  const [plans, setPlans] = useState([]);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      company_id: subscription?.company_id || undefined,
      subscription_plan_id: subscription?.subscription_plan_id || undefined,
      starts_at: subscription?.starts_at ? String(subscription.starts_at).slice(0, 16) : "",
      ends_at: subscription?.ends_at ? String(subscription.ends_at).slice(0, 16) : "",
      status: subscription?.status || "active",
      auto_renew: Boolean(subscription?.auto_renew),
      currency: subscription?.currency || "QAR",
      billing_cycle: subscription?.billing_cycle || "monthly",
      custom_price: subscription?.custom_price ?? "",
      discount_type: subscription?.discount_type || "none",
      discount_value: subscription?.discount_value ?? "",
      tax_rate: subscription?.tax_rate ?? "",
    },
  });
  const selectedPlanId = useWatch({ control, name: "subscription_plan_id" });
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);
  const [currency, cycle, customPrice, discountType, discountValue, taxRate] = useWatch({
    control,
    name: ["currency", "billing_cycle", "custom_price", "discount_type", "discount_value", "tax_rate"],
  });
  const effectiveTaxRate = taxRate !== "" && taxRate != null ? taxRate : subscription?.pricing?.tax_rate ?? 0;
  const preview = pricingPreview({
    plan: selectedPlan,
    currency,
    cycle,
    customPrice,
    discountType,
    discountValue,
    taxRate: effectiveTaxRate,
  });

  useEffect(() => {
    Promise.all([companiesApi.list(), platformApi.plans()])
      .then(([companyRows, planRows]) => {
        setCompanies(Array.isArray(companyRows) ? companyRows : []);
        setPlans(Array.isArray(planRows) ? planRows : []);
      })
      .catch((error) => toast.error(apiError(error, "Failed to load form data")));
  }, []);

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        const payload = {
          ...values,
          starts_at: values.starts_at ? new Date(values.starts_at).toISOString() : undefined,
          ends_at: values.ends_at ? new Date(values.ends_at).toISOString() : null,
          custom_price: values.custom_price === "" ? null : Number(values.custom_price),
          discount_type: values.discount_type === "none" ? null : values.discount_type,
          discount_value: values.discount_type === "none" || values.discount_value === "" ? null : Number(values.discount_value),
          tax_rate: values.tax_rate === "" ? null : Number(values.tax_rate),
        };
        try {
          if (subscription) {
            await platformApi.updateSubscription(subscription.id, payload);
            toast.success(t("subscription_updated", { defaultMessage: "Subscription updated" }));
          } else {
            await platformApi.createSubscription(payload);
            toast.success(t("subscription_created", { defaultMessage: "Subscription created" }));
          }
          router.push("/subscriptions");
        } catch (error) {
          toast.error(apiError(error, t("subscription_save_failed", { defaultMessage: "Unable to save subscription" })));
        }
      })}
    >
      <PageHeader
        icon={CreditCard}
        title={subscription ? t("edit_subscription", { defaultMessage: "Edit subscription" }) : t("new_subscription", { defaultMessage: "Assign subscription" })}
        description={t("subscription_form_desc", { defaultMessage: "Attach a plan to a company. An active paid plan converts any open trial." })}
      />

      <div className="glass-panel grid gap-4 rounded-2xl p-6 md:grid-cols-2">
        {!subscription && (
          <div className="md:col-span-2">
            <SelectField
              label={t("company", { defaultMessage: "Company" })}
              name="company_id"
              control={control}
              validation={{ required: "Required" }}
              options={companies.map((company) => ({ value: company.id, label: company.name }))}
            />
          </div>
        )}
        <TextField label={t("starts", { defaultMessage: "Starts" })} name="starts_at" type="datetime-local" control={control} validation={{ required: "Required" }} />
        <TextField label={t("ends", { defaultMessage: "Ends" })} name="ends_at" type="datetime-local" control={control} />
        <SelectField
          label={t("status", { defaultMessage: "Status" })}
          name="status"
          control={control}
          options={["pending", "active", "expired", "cancelled"].map((value) => ({ value, label: t(value, { defaultMessage: value }) }))}
        />
        <SwitchField
          label={t("auto_renew", { defaultMessage: "Auto renew" })}
          description={t("auto_renew_desc", { defaultMessage: "Keep the company on this plan when the end date is reached." })}
          name="auto_renew"
          control={control}
        />
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
          {t("billing_pricing", { defaultMessage: "Billing & pricing" })}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("billing_pricing_desc", { defaultMessage: "A special price applies to this company only and never changes the plan's standard price." })}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <SelectField
            label={t("billing_cycle", { defaultMessage: "Billing cycle" })}
            name="billing_cycle"
            control={control}
            options={BILLING_CYCLES.map((value) => ({ value, label: t(`cycle_${value}`, { defaultMessage: labelize(value) }) }))}
          />
          <SelectField
            label={t("currency", { defaultMessage: "Currency" })}
            name="currency"
            control={control}
            options={BILLING_CURRENCIES.map((value) => ({ value, label: value }))}
          />
          <TextField
            label={t("special_price", { defaultMessage: "Special price (optional)" })}
            name="custom_price"
            type="number"
            min="0"
            step="0.001"
            placeholder={preview.standard != null ? String(preview.standard) : "—"}
            control={control}
          />
          <SelectField
            label={t("discount", { defaultMessage: "Discount" })}
            name="discount_type"
            control={control}
            options={[
              { value: "none", label: t("no_discount", { defaultMessage: "No discount" }) },
              { value: "percent", label: t("discount_percent", { defaultMessage: "Percentage (%)" }) },
              { value: "fixed", label: t("discount_fixed", { defaultMessage: "Fixed amount" }) },
            ]}
          />
          {discountType === "none" ? (
            <div className="hidden md:block" />
          ) : (
            <TextField
              label={discountType === "percent"
                ? t("discount_percent_value", { defaultMessage: "Discount (%)" })
                : t("discount_amount_value", { defaultMessage: "Discount amount" })}
              name="discount_value"
              type="number"
              min="0"
              max={discountType === "percent" ? "100" : undefined}
              step="0.001"
              control={control}
            />
          )}
          <TextField
            label={t("tax_rate_percent", { defaultMessage: "Tax rate % (blank = platform default)" })}
            name="tax_rate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            control={control}
          />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
          {[
            ["standard_price", "Standard price", preview.standard],
            ["discount", "Discount", preview.discount ? -preview.discount : 0],
            ["net_price", "Net price", preview.net],
            ["tax", "Tax", preview.tax],
            ["total_per_cycle", "Total per cycle", preview.total],
          ].map(([key, fallback, amount]) => (
            <div key={key} className={cn("rounded-xl bg-slate-100/80 px-3 py-2 dark:bg-white/5", key === "total_per_cycle" && "bg-violet-50 dark:bg-violet-500/10")}>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">{t(key, { defaultMessage: fallback })}</p>
              <p className="font-semibold text-slate-900 dark:text-white">{formatMoney(amount, currency)}</p>
            </div>
          ))}
        </div>
        {selectedPlan && preview.standard == null && (customPrice === "" || customPrice == null) && (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-300">
            {t("no_plan_price_warning", { defaultMessage: "This plan has no standard price for the selected currency and cycle. Set a special price, or it will be treated as free and no invoice will be drafted." })}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t("choose_plan", { defaultMessage: "Choose a plan" })}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("choose_plan_desc", { defaultMessage: "Compare limits and features, then assign one pack." })}</p>
        </div>
        <Controller
          name="subscription_plan_id"
          control={control}
          rules={{ required: "Required" }}
          render={({ field, fieldState }) => (
            <div className="space-y-3">
              <div className="grid gap-4 lg:grid-cols-3">
                {plans.map((plan) => {
                  const active = field.value === plan.id;
                  const assignable = plan.is_active || plan.id === subscription?.subscription_plan_id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      disabled={!assignable}
                      onClick={() => field.onChange(plan.id)}
                      className={cn(
                        "glass-panel rounded-2xl p-5 text-left transition",
                        active && "ring-2 ring-violet-500",
                        !assignable && "opacity-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {plan.active_subscriptions_count || 0} {t("active_companies", { defaultMessage: "active companies" })}
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
                        </div>
                        <StatusBadge value={plan.is_active ? "active" : "inactive"} />
                      </div>
                      <p className="mt-2 min-h-10 text-sm text-slate-500 dark:text-slate-400">{plan.description || "—"}</p>
                      <p className="mt-2 text-sm font-semibold text-violet-700 dark:text-violet-300">
                        {planPrice(plan, currency, cycle) != null
                          ? `${formatMoney(planPrice(plan, currency, cycle), currency)} / ${t(`cycle_${cycle}`, { defaultMessage: labelize(cycle) })}`
                          : t("no_price_set", { defaultMessage: "No price for this currency" })}
                      </p>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-slate-100/80 p-2 dark:bg-white/5">
                          <p className="font-semibold text-slate-900 dark:text-white">{limitLabel(plan.max_users)}</p>
                          <p className="text-[10px] uppercase text-slate-400">{t("users", { defaultMessage: "Users" })}</p>
                        </div>
                        <div className="rounded-xl bg-slate-100/80 p-2 dark:bg-white/5">
                          <p className="font-semibold text-slate-900 dark:text-white">{limitLabel(plan.max_properties)}</p>
                          <p className="text-[10px] uppercase text-slate-400">{t("properties", { defaultMessage: "Properties" })}</p>
                        </div>
                        <div className="rounded-xl bg-slate-100/80 p-2 dark:bg-white/5">
                          <p className="font-semibold text-slate-900 dark:text-white">{plan.feature_count || 0}</p>
                          <p className="text-[10px] uppercase text-slate-400">{t("features", { defaultMessage: "Features" })}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {fieldState.error && <p className="text-sm text-red-500">{fieldState.error.message}</p>}
            </div>
          )}
        />
      </div>

      {selectedPlan && (
        <div className="glass-panel rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
            {t("included_features", { defaultMessage: "Included features" })}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{selectedPlan.name}</h3>
          <div className="mt-4">
            <FeatureChecklist items={selectedPlan.feature_items || []} />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/subscriptions")}>
          {t("cancel", { defaultMessage: "Cancel" })}
        </Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-full bg-violet-600 hover:bg-violet-700">
          {subscription ? t("save_changes", { defaultMessage: "Save changes" }) : t("assign_plan", { defaultMessage: "Assign plan" })}
        </Button>
      </div>
    </form>
  );
}
