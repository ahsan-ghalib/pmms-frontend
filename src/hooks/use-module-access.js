"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Roles, normalizeRole } from "@/lib/permissions/role-access";
import {
  ensureModuleAccess,
  getModuleAccessSnapshot,
  subscribeModuleAccess,
} from "@/lib/permissions/module-access";

const serverSnapshot = () => null;

/**
 * What the signed-in user's role permissions allow: menu modules, pages and in-page actions.
 * Action checks wait for the live permission list, so buttons never flash for users who lack them.
 */
export function useModuleAccess() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const live = useSyncExternalStore(subscribeModuleAccess, getModuleAccessSnapshot, serverSnapshot);
  const token = session?.accessToken;
  const isSuperAdmin = normalizeRole(session?.user?.role) === Roles.SUPER_ADMIN;
  const current = live && live.token === token ? live : null;
  const modules = current?.modules ?? session?.user?.modules ?? null;
  const permissions = current?.permissions ?? null;

  useEffect(() => {
    if (token && !isSuperAdmin) ensureModuleAccess(token).catch(() => {});
  }, [token, isSuperAdmin, pathname]);

  const canSee = (module) => {
    if (!module || isSuperAdmin) return true;
    return Array.isArray(modules) && modules.includes(module);
  };

  /** True when the user holds any of the given permission names. */
  const can = (required) => {
    if (isSuperAdmin) return true;
    if (!Array.isArray(permissions)) return false;
    const list = Array.isArray(required) ? required : [required];
    return list.some((name) => permissions.includes(name));
  };

  return {
    modules: modules || [],
    permissions: permissions || [],
    ready: isSuperAdmin || Array.isArray(permissions),
    isSuperAdmin,
    canSee,
    can,
  };
}

/** Shorthand for in-page action checks: `const can = useCan(); can("Add Inventory")`. */
export function useCan() {
  return useModuleAccess().can;
}
