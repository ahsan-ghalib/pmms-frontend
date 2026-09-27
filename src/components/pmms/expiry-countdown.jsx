"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { formatDate } from "@/lib/pmms";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";

function remainingParts(expiresAt, now) {
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return null;
  const diff = Math.max(0, end - now);
  return {
    expired: diff === 0 && end <= now,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function ExpiryCountdown({
  expiresAt,
  access,
  planName,
  className,
}) {
  const t = useT("common");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!access || access === "platform") return null;

  const remaining = expiresAt ? remainingParts(expiresAt, now) : null;
  const label = access === "trial"
    ? t("trial_expires", { defaultMessage: "Trial expires" })
    : t("subscription_expires", { defaultMessage: "Subscription expires" });

  return (
    <div className={cn("glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
          <Timer className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
            {access === "none"
              ? t("no_active_plan", { defaultMessage: "No active plan" })
              : planName || (access === "trial" ? t("on_trial", { defaultMessage: "On trial" }) : t("subscription", { defaultMessage: "Subscription" }))}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
            {access === "none"
              ? t("assign_plan_to_unlock", { defaultMessage: "Assign a trial or plan to unlock modules." })
              : expiresAt
                ? `${label}: ${formatDate(expiresAt)}`
                : t("open_ended", { defaultMessage: "Open-ended access" })}
          </p>
        </div>
      </div>
      {remaining && (
        <div className="flex items-center gap-2 text-center">
          {[
            [remaining.days, t("days_short", { defaultMessage: "Days" })],
            [remaining.hours, t("hours_short", { defaultMessage: "Hrs" })],
            [remaining.minutes, t("minutes_short", { defaultMessage: "Min" })],
            [remaining.seconds, t("seconds_short", { defaultMessage: "Sec" })],
          ].map(([value, unit]) => (
            <div key={unit} className="min-w-[3.5rem] rounded-xl bg-white/70 px-2 py-2 dark:bg-white/5">
              <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{String(value).padStart(2, "0")}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">{unit}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
