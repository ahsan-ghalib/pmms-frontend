"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useModuleAccess } from "@/hooks/use-module-access";
import { actionPermissionForPath, landingPathFor, moduleForPath } from "@/lib/permissions/module-access";
import { Loader2 } from "lucide-react";

export default function AuthAndPermissionWrapper({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const { ready, isSuperAdmin, modules, canSee, can } = useModuleAccess();

  const routeModule = moduleForPath(pathname);
  const actionPermission = actionPermissionForPath(pathname);
  const allowed = isSuperAdmin || (
    (routeModule === null || (routeModule !== undefined && canSee(routeModule)))
    && (!actionPermission || can(actionPermission))
  );
  const deciding = status === "loading" || (status === "authenticated" && !ready);
  const redirectTo = !deciding && status === "authenticated" && !allowed
    ? (routeModule === "dashboard" && landingPathFor(modules)) || "/not-allowed"
    : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (status === "unauthenticated") return null;

  if (deciding || redirectTo) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
