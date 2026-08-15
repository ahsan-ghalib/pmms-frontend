"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";
import BrandMark from "@/components/landing/BrandMark";
import { NavIcon } from "@/components/layouts/nav-main";

export function SidebarBrand() {
  const t = useT("common");

  return (
    <Link href="/dashboard" className="sidebar-brand group">
      <BrandMark className="sidebar-brand-mark h-10 w-10 shadow-none" />
      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
        <p className="sidebar-brand-title truncate">
          {t("pmms_brand", { defaultMessage: "PMMS" })}
        </p>
        <p className="sidebar-brand-subtitle">
          {t("pmms_subtitle", { defaultMessage: "Maintenance" })}
        </p>
      </div>
    </Link>
  );
}

export function NavDashboard() {
  const t = useT("common");
  const pathname = usePathname();
  const active = isPathActive(pathname, "/dashboard");

  return (
    <Link
      href="/dashboard"
      className={cn("nav-dashboard-link", active && "nav-item-active")}
    >
      <NavIcon icon={LayoutDashboard} />
      <span className="truncate">{t("dashboard", { defaultMessage: "Dashboard" })}</span>
    </Link>
  );
}

function isPathActive(pathname, url) {
  if (pathname === url) return true;
  if (url !== "/" && pathname.startsWith(`${url}/`)) return true;
  return false;
}
