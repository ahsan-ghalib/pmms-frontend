"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({
  children,
  requiredPermissions,
  requireAll = false,
  fallback = null,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const permissions = usePermissions();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      if (status === "loading") {
        return;
      }

      if (status === "unauthenticated" || !session) {
        setIsChecking(false);
        return;
      }

      if (!requiredPermissions || (Array.isArray(requiredPermissions) && requiredPermissions.length === 0)) {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      try {
        const permissionArray = Array.isArray(requiredPermissions)
          ? requiredPermissions
          : [requiredPermissions];

        let hasRequiredPermission = false;

        if (requireAll) {
          const results = await Promise.all(
            permissionArray.map((perm) => hasPermission(perm))
          );
          hasRequiredPermission = results.every((result) => result === true);
        } else {
          hasRequiredPermission = await hasPermission(permissionArray);
        }

        if (!hasRequiredPermission) {
          router.replace("/not-allowed");
          return;
        }

        setHasAccess(true);
      } catch (error) {
        router.replace("/not-allowed");
      } finally {
        setIsChecking(false);
      }
    };

    checkPermission();
  }, [requiredPermissions, requireAll, session, status, router, pathname, permissions.length]);

  if (isChecking || status === "loading") {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
