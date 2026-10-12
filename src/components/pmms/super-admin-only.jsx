"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";

export default function SuperAdminOnly({ redirectTo, children }) {
  const router = useRouter();
  const { data, status } = useSession();
  const allowed = normalizeRole(data?.user?.role) === Roles.SUPER_ADMIN;

  useEffect(() => {
    if (status === "authenticated" && !allowed) router.replace(redirectTo);
  }, [status, allowed, redirectTo, router]);

  return allowed ? children : null;
}
