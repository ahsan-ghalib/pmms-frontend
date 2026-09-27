"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";

export default function PlanFeatureGrid({ groups = [] }) {
  const t = useT("common");
  const router = useRouter();
  const { canUseFeature, warnLocked } = usePlanAccess();

  if (!groups.length) return null;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">
          {t("available_modules", { defaultMessage: "Available modules" })}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
          {t("available_modules_desc", { defaultMessage: "Features in your plan are active. Locked items need an upgrade." })}
        </h2>
      </div>
      {groups.map((group) => (
        <div key={group.id} className="space-y-3">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{group.title}</h3>
            {group.description && <p className="text-xs text-slate-500">{group.description}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(group.features || []).map((feature) => {
              const included = feature.included ?? canUseFeature(feature.key);
              return (
                <button
                  key={feature.key}
                  type="button"
                  onClick={() => {
                    if (!included) {
                      warnLocked();
                      return;
                    }
                    if (feature.href) router.push(feature.href);
                  }}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",
                    included
                      ? "border-slate-200/80 bg-white/70 hover:border-violet-300 dark:border-white/10 dark:bg-white/5"
                      : "cursor-not-allowed border-slate-200/60 bg-slate-100/70 opacity-60 grayscale dark:border-white/5 dark:bg-white/[0.03]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{feature.label}</p>
                    {!included && <Lock className="h-4 w-4 shrink-0 text-slate-400" />}
                  </div>
                  {feature.description && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{feature.description}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
