"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import DriversTable from "./drivers-table";
import { Users, UserCheck, UserX, ShieldCheck, ShieldAlert } from "lucide-react";

export default function DriversOverview() {
  const t = useTranslations("admin");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    verified: 0,
    unverified: 0,
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards — dashboard style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5 mb-6">
        {/* Total Drivers */}
        <div className="glass-panel group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl md:p-6">
          <div className="glass-stat-glow bg-violet-500" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Total_Drivers", { defaultMessage: "Total Drivers" })}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{stats.total}</p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">{t("All_registered_drivers", { defaultMessage: "All registered drivers" })}</p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <Users className="size-5 text-white drop-shadow" strokeWidth={2.25} />
            </div>
          </div>
        </div>

        {/* Active */}
        <div className="glass-panel group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl md:p-6">
          <div className="glass-stat-glow bg-emerald-500" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Active_Drivers", { defaultMessage: "Active Drivers" })}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 md:text-3xl">{stats.active}</p>
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
                <UserCheck className="size-3" />
                {t("Currently_active", { defaultMessage: "Currently active" })}
              </p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
              <UserCheck className="size-5 text-white drop-shadow" strokeWidth={2.25} />
            </div>
          </div>
        </div>

        {/* Verified */}
        <div className="glass-panel group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl md:p-6">
          <div className="glass-stat-glow bg-blue-500" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Verified", { defaultMessage: "Verified" })}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-blue-600 md:text-3xl">{stats.verified}</p>
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-600">
                <ShieldCheck className="size-3" />
                {t("Fully_vetted", { defaultMessage: "Fully vetted" })}
              </p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
              <ShieldCheck className="size-5 text-white drop-shadow" strokeWidth={2.25} />
            </div>
          </div>
        </div>

        {/* Unverified */}
        <div className="glass-panel group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl md:p-6">
          <div className="glass-stat-glow bg-amber-500" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Unverified", { defaultMessage: "Unverified" })}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600 md:text-3xl">{stats.unverified}</p>
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-600">
                <ShieldAlert className="size-3" />
                {t("Action_needed", { defaultMessage: "Action needed" })}
              </p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
              <ShieldAlert className="size-5 text-white drop-shadow" strokeWidth={2.25} />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <DriversTable onStatsChange={setStats} />
      </div>
    </div>
  );
}
