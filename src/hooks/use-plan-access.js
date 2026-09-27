"use client";

import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  featureForModule,
  featureForPath,
  hasPlanFeature,
  lockedMessage,
} from "@/lib/permissions/plan-features";

export function usePlanAccess() {
  const { data: session } = useSession();
  const entitlements = session?.user?.entitlements;

  const canUseFeature = (feature) => hasPlanFeature(entitlements, feature);
  const canUseModule = (module) => canUseFeature(featureForModule(module));
  const canUsePath = (pathname) => canUseFeature(featureForPath(pathname));

  const warnLocked = () => {
    toast.error(lockedMessage(entitlements));
  };

  const guardNavigation = (moduleOrFeature, isModule = true) => {
    const allowed = isModule ? canUseModule(moduleOrFeature) : canUseFeature(moduleOrFeature);
    if (!allowed) {
      warnLocked();
      return false;
    }
    return true;
  };

  return {
    entitlements,
    company: session?.user?.company,
    canUseFeature,
    canUseModule,
    canUsePath,
    warnLocked,
    guardNavigation,
    lockedMessage: lockedMessage(entitlements),
  };
}
