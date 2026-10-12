"use client";

import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { useT } from "@/lib/use-t";

export default function PlanAccessGuard({ children }) {
  const pathname = usePathname();
  const t = useT("common");
  const { canUsePath, featureForPath, lockedMessage } = usePlanAccess();
  const feature = featureForPath(pathname);

  if (!feature || canUsePath(pathname)) {
    return children;
  }

  return (
    <div className="glass-panel mx-auto mt-10 max-w-xl rounded-2xl p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/10">
        <Lock className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
        {t("feature_locked_title", { defaultMessage: "Feature locked" })}
      </h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{lockedMessage}</p>
    </div>
  );
}
