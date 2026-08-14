"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  CreditCard,
  Layers3,
  Pencil,
  Plus,
  Timer,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/pmms/status-badge";
import PageHeader from "@/components/pmms/page-header";
import EmptyState from "@/components/pmms/empty-state";
import StatCard from "@/components/common/stat-card";
import { FeaturePills } from "@/containers/platform/plan-feature-picker";
import { platformApi } from "@/services/platform/platform-api";
import { apiError, formatDate } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { cn } from "@/lib/utils";

function limitLabel(value) {
  return value == null || value === "" ? "∞" : value;
}

function currentTab() {
  if (typeof window === "undefined") return "subscriptions";
  return new URLSearchParams(window.location.search).get("tab") === "plans" ? "plans" : "subscriptions";
}

export default function SubscriptionsHub() {
  const t = useT("common");
  const router = useRouter();
  const role = normalizeRole(useSession().data?.user?.role);
  const canManage = role === Roles.SUPER_ADMIN;
  const [tab, setTab] = useState("subscriptions");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [plans, setPlans] = useState([]);

  const load = async () => {
    try {
      const [subs, planRows] = await Promise.all([platformApi.subscriptions(), platformApi.plans()]);
      setRows(Array.isArray(subs) ? subs : []);
      setPlans(Array.isArray(planRows) ? planRows : []);
    } catch (error) {
      toast.error(apiError(error, t("subscriptions_load_failed", { defaultMessage: "Failed to load subscriptions" })));
    }
  };

  useEffect(() => {
    setTab(currentTab());
    load();
  }, []);

  const setHubTab = (next) => {
    setTab(next);
    const url = next === "plans" ? "/subscriptions?tab=plans" : "/subscriptions";
    router.replace(url, { scroll: false });
  };

  const stats = useMemo(() => {
    const active = rows.filter((row) => row.status === "active");
    return {
      active: active.length,
      expiring: rows.filter((row) => row.is_expiring_soon).length,
      expired: rows.filter((row) => row.status === "expired").length,
      cancelled: rows.filter((row) => row.status === "cancelled").length,
      pending: rows.filter((row) => row.status === "pending").length,
      companies: new Set(active.map((row) => row.company_id)).size,
      plans: plans.filter((plan) => plan.is_active).length,
    };
  }, [rows, plans]);

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    if (statusFilter === "expiring") return rows.filter((row) => row.is_expiring_soon);
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

  const filters = [
    { id: "all", label: t("all", { defaultMessage: "All" }), count: rows.length },
    { id: "active", label: t("active", { defaultMessage: "Active" }), count: stats.active },
    { id: "expiring", label: t("expiring_soon", { defaultMessage: "Expiring soon" }), count: stats.expiring },
    { id: "pending", label: t("pending", { defaultMessage: "Pending" }), count: stats.pending },
    { id: "expired", label: t("expired", { defaultMessage: "Expired" }), count: stats.expired },
    { id: "cancelled", label: t("cancelled", { defaultMessage: "Cancelled" }), count: stats.cancelled },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CreditCard}
        title={t("subscriptions_title", { defaultMessage: "Subscriptions" })}
        description={t("subscriptions_desc", { defaultMessage: "Plans, company assignments, and feature packs in one place." })}
        actions={canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => router.push("/subscriptions/plans/create")}>
              <Layers3 className="mr-2 h-4 w-4" /> {t("new_plan", { defaultMessage: "New plan" })}
            </Button>
            <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push("/subscriptions/create")}>
              <Plus className="mr-2 h-4 w-4" /> {t("new_subscription", { defaultMessage: "Assign subscription" })}
            </Button>
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <StatCard title={t("active", { defaultMessage: "Active" })} value={stats.active} theme="green" icon={CreditCard} />
        <StatCard title={t("expiring_soon", { defaultMessage: "Expiring soon" })} value={stats.expiring} theme="amber" icon={Timer} />
        <StatCard title={t("expired", { defaultMessage: "Expired" })} value={stats.expired} theme="orange" icon={CreditCard} />
        <StatCard title={t("cancelled", { defaultMessage: "Cancelled" })} value={stats.cancelled} theme="rose" icon={CreditCard} />
        <StatCard title={t("companies", { defaultMessage: "Companies" })} value={stats.companies} theme="blue" icon={Building2} />
        <StatCard title={t("active_plans", { defaultMessage: "Active plans" })} value={stats.plans} theme="purple" icon={Layers3} />
      </div>

      <div className="flex gap-2">
        {["subscriptions", "plans"].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setHubTab(id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              tab === id
                ? "bg-violet-600 text-white shadow-sm"
                : "glass-panel text-slate-600 hover:text-slate-900 dark:text-slate-300"
            )}
          >
            {id === "subscriptions"
              ? t("sidebar_subscriptions", { defaultMessage: "Subscriptions" })
              : t("plans_tab", { defaultMessage: "Plans" })}
            <span className="ml-2 text-xs opacity-80">{id === "subscriptions" ? rows.length : plans.length}</span>
          </button>
        ))}
      </div>

      {tab === "subscriptions" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  statusFilter === filter.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                )}
              >
                {filter.label} · {filter.count}
              </button>
            ))}
          </div>

          {filteredRows.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title={t("no_subscriptions", { defaultMessage: "No subscriptions" })}
              description={t("no_subscriptions_desc", { defaultMessage: "Create a plan first, then assign it to a company." })}
              actionLabel={canManage ? t("new_subscription", { defaultMessage: "Assign subscription" }) : undefined}
              onAction={canManage ? () => router.push("/subscriptions/create") : undefined}
            />
          ) : (
            <div className="space-y-3">
              {filteredRows.map((row) => (
                <div key={row.id} className="glass-panel rounded-2xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{row.company_name || row.company_id}</h3>
                        {row.company_code && (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-500 dark:bg-white/10 dark:text-slate-300">
                            {row.company_code}
                          </span>
                        )}
                        <StatusBadge value={row.status} />
                        {row.auto_renew && (
                          <span className="text-xs font-medium text-violet-600 dark:text-violet-300">
                            {t("auto_renew", { defaultMessage: "Auto renew" })}
                          </span>
                        )}
                        {row.is_expiring_soon && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                            {t("expiring_soon", { defaultMessage: "Expiring soon" })}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {row.plan_name} · {formatDate(row.starts_at)} → {row.ends_at ? formatDate(row.ends_at) : t("open_ended", { defaultMessage: "Open" })}
                        {row.days_remaining != null && row.status === "active" && (
                          <span> · {row.days_remaining} {t("days_left", { defaultMessage: "days left" })}</span>
                        )}
                      </p>
                    </div>
                    {canManage && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => router.push(`/subscriptions/${row.id}/edit`)}>
                          <Pencil className="mr-1 h-3.5 w-3.5" /> {t("edit", { defaultMessage: "Edit" })}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600"
                          onClick={async () => {
                            try {
                              await platformApi.deleteSubscription(row.id);
                              toast.success(t("subscription_removed", { defaultMessage: "Subscription removed" }));
                              load();
                            } catch (error) {
                              toast.error(apiError(error, "Unable to delete"));
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                    <div className="rounded-xl bg-slate-100/80 px-3 py-2 dark:bg-white/5">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400">{t("users", { defaultMessage: "Users" })}</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{limitLabel(row.plan?.max_users)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-100/80 px-3 py-2 dark:bg-white/5">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400">{t("properties", { defaultMessage: "Properties" })}</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{limitLabel(row.plan?.max_properties)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-100/80 px-3 py-2 dark:bg-white/5">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400">{t("storage", { defaultMessage: "Storage" })}</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{limitLabel(row.plan?.max_storage_mb)}{row.plan?.max_storage_mb ? " MB" : ""}</p>
                    </div>
                    <div className="rounded-xl bg-slate-100/80 px-3 py-2 dark:bg-white/5">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400">{t("features", { defaultMessage: "Features" })}</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{row.plan?.feature_count || 0}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <FeaturePills items={row.plan?.feature_items || []} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={Layers3}
          title={t("no_plans", { defaultMessage: "No plans yet" })}
          description={t("no_plans_desc", { defaultMessage: "Create Starter, Professional, and Enterprise packs before assigning subscriptions." })}
          actionLabel={canManage ? t("new_plan", { defaultMessage: "New plan" }) : undefined}
          onAction={canManage ? () => router.push("/subscriptions/plans/create") : undefined}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="glass-panel flex flex-col rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {plan.active_subscriptions_count || 0} {t("active_companies", { defaultMessage: "active companies" })}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
                </div>
                <StatusBadge value={plan.is_active ? "active" : "inactive"} />
              </div>
              <p className="mt-2 min-h-10 text-sm text-slate-500 dark:text-slate-400">{plan.description || t("no_description", { defaultMessage: "No description" })}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-100/80 p-3 dark:bg-white/5">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{limitLabel(plan.max_users)}</p>
                  <p className="text-[11px] uppercase text-slate-400">{t("users", { defaultMessage: "Users" })}</p>
                </div>
                <div className="rounded-xl bg-slate-100/80 p-3 dark:bg-white/5">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{limitLabel(plan.max_properties)}</p>
                  <p className="text-[11px] uppercase text-slate-400">{t("properties", { defaultMessage: "Properties" })}</p>
                </div>
                <div className="rounded-xl bg-slate-100/80 p-3 dark:bg-white/5">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{plan.feature_count || 0}</p>
                  <p className="text-[11px] uppercase text-slate-400">{t("features", { defaultMessage: "Features" })}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-emerald-50 px-2 py-1.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {plan.active_subscriptions_count || 0} {t("active", { defaultMessage: "active" })}
                </div>
                <div className="rounded-lg bg-amber-50 px-2 py-1.5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                  {plan.expired_subscriptions_count || 0} {t("expired", { defaultMessage: "expired" })}
                </div>
                <div className="rounded-lg bg-rose-50 px-2 py-1.5 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                  {plan.cancelled_subscriptions_count || 0} {t("cancelled", { defaultMessage: "cancelled" })}
                </div>
              </div>
              <div className="mt-4 flex-1">
                <FeaturePills items={plan.feature_items || []} />
              </div>
              {canManage && (
                <div className="mt-5 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => router.push(`/subscriptions/plans/${plan.id}/edit`)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> {t("edit", { defaultMessage: "Edit" })}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-600"
                    onClick={async () => {
                      try {
                        await platformApi.deletePlan(plan.id);
                        toast.success(t("plan_deleted", { defaultMessage: "Plan deleted" }));
                        load();
                      } catch (error) {
                        toast.error(apiError(error, t("plan_delete_failed", { defaultMessage: "Unable to delete plan" })));
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
