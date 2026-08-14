"use client";

import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import { useDutyTracking } from "@/hooks/use-duty-tracking";

export default function DutyTrackingProvider({ children }) {
  const { data: session } = useSession();
  const role = normalizeRole(session?.user?.role);
  useDutyTracking({ enabled: role === Roles.TECHNICIAN });

  return children;
}
