"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { getUserPermissions } from "@/lib/permissions";

export function PermissionsInitializer() {
  const { data: session, status } = useSession();
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user && !hasLoaded.current) {
      hasLoaded.current = true;
      getUserPermissions()
        .catch(() => {
          hasLoaded.current = false;
        });
    }
  }, [status, session]);

  return null;
}
