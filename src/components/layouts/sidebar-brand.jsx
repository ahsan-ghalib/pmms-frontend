"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";
import { NavIcon } from "@/components/layouts/nav-main";

export function SidebarBrand() {
  const t = useT("common");

  return (
    <Link href="/" className="sidebar-brand group transition-opacity hover:opacity-90">
      <div className="sidebar-brand-logo">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#7C3AED,#A855F7)] text-[10px] font-black text-white">
          P
        </span>
      </div>
      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
        <p className="sidebar-brand-title truncate">
          {t("pmms_brand", { defaultMessage: "PMMS" })}
        </p>
        <p className="sidebar-brand-subtitle">{t("pmms_subtitle", { defaultMessage: "Maintenance" })}</p>
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
      <NavIcon icon={LayoutDashboard} index={0} />
      <span className="truncate">{t("dashboard", { defaultMessage: "Dashboard" })}</span>
    </Link>
  );
}

function isPathActive(pathname, url) {
  if (pathname === url) return true;
  if (url !== "/" && pathname.startsWith(`${url}/`)) return true;
  return false;
}
