"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, CreditCard, Pencil, Timer, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/pmms/page-header";
import StatCard from "@/components/common/stat-card";
import { StatusBadge } from "@/components/pmms/status-badge";
import { companiesApi } from "@/services/companies/companies-api";
import { apiError, formatDate } from "@/lib/pmms";
import { useT } from "@/lib/use-t";

export default function CompanyDetails() {
  const { id } = useParams();
  const router = useRouter();
  const t = useT("common");
  const [company, setCompany] = useState(null);

  const load = async () => {
    try {
      setCompany(await companiesApi.show(id));
    } catch (error) {
      toast.error(apiError(error, t("company_load_failed", { defaultMessage: "Failed to load company" })));
    }
  };

  useEffect(() => { load(); }, [id]);

  if (!company) return <div className="p-8 text-center text-muted-foreground">Loading company...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Building2}
        title={company.name}
        description={company.legal_name || company.code}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/companies")}>{t("back", { defaultMessage: "Back" })}</Button>
            <Button className="rounded-full bg-violet-600 hover:bg-violet-700" onClick={() => router.push(`/companies/${company.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" /> {t("edit", { defaultMessage: "Edit" })}
            </Button>
            {company.archived_at ? (
              <Button variant="outline" onClick={async () => { await companiesApi.restore(company.id); toast.success(t("restored", { defaultMessage: "Restored" })); load(); }}>
                {t("restore", { defaultMessage: "Restore" })}
              </Button>
            ) : (
              <Button variant="destructive" onClick={async () => { await companiesApi.archive(company.id); toast.success(t("archived", { defaultMessage: "Archived" })); load(); }}>
                {t("archive", { defaultMessage: "Archive" })}
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title={t("users", { defaultMessage: "Users" })} value={company.users_count ?? 0} theme="blue" icon={Users} />
        <StatCard title={t("properties", { defaultMessage: "Properties" })} value={company.properties_count ?? 0} theme="purple" icon={Building2} />
        <StatCard title={t("sidebar_subscriptions", { defaultMessage: "Subscriptions" })} value={company.subscriptions_count ?? 0} theme="green" icon={CreditCard} />
        <StatCard title={t("sidebar_trials", { defaultMessage: "Trials" })} value={company.trials_count ?? 0} theme="amber" icon={Timer} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
            {t("company_details", { defaultMessage: "Company details" })}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              [t("code", { defaultMessage: "Code" }), company.code],
              [t("email", { defaultMessage: "Email" }), company.email || "—"],
              [t("phone", { defaultMessage: "Phone" }), company.phone || "—"],
              [t("timezone", { defaultMessage: "Timezone" }), company.timezone || "—"],
              [t("default_language", { defaultMessage: "Default language" }), company.default_language || "—"],
              [t("status", { defaultMessage: "Status" }), <StatusBadge key="status" value={company.archived_at ? "archived" : company.status} />],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                <div className="mt-1 font-semibold text-slate-900 dark:text-white">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{t("address", { defaultMessage: "Address" })}</p>
            <p className="mt-1 text-slate-700 dark:text-slate-200">{company.address || "—"}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
            {t("access", { defaultMessage: "Access" })}
          </p>
          {company.active_subscription ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{company.active_subscription.plan_name}</h3>
                <StatusBadge value={company.active_subscription.status} />
              </div>
              <p className="text-sm text-slate-500">
                {formatDate(company.active_subscription.starts_at)} → {company.active_subscription.ends_at ? formatDate(company.active_subscription.ends_at) : t("open_ended", { defaultMessage: "Open" })}
              </p>
              {company.active_subscription.auto_renew && (
                <p className="text-xs font-medium text-violet-600">{t("auto_renew", { defaultMessage: "Auto renew" })}</p>
              )}
            </div>
          ) : company.active_trial ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t("on_trial", { defaultMessage: "On trial" })}</h3>
                <StatusBadge value={company.active_trial.status} />
              </div>
              <p className="text-sm text-slate-500">
                {formatDate(company.active_trial.starts_at)} → {formatDate(company.active_trial.expires_at)}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">{t("no_access", { defaultMessage: "No trial or paid plan assigned yet." })}</p>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
          {t("company_admins", { defaultMessage: "Company admins" })}
        </p>
        {(company.admins || []).length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">{t("no_admins", { defaultMessage: "No company admin has been created yet." })}</p>
        ) : (
          <div className="mt-3 divide-y divide-slate-200/70 dark:divide-white/10">
            {company.admins.map((admin) => (
              <div key={admin.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{admin.name}</p>
                  <p className="text-sm text-slate-500">{admin.email}{admin.phone ? ` · ${admin.phone}` : ""}</p>
                </div>
                <StatusBadge value={admin.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
