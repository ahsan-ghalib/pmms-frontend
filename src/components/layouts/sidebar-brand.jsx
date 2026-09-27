"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard } from "lucide-react";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";
import BrandMark from "@/components/landing/BrandMark";
import { NavIcon } from "@/components/layouts/nav-main";

function companyInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CO";
}

export function SidebarBrand() {
  const t = useT("common");
  const { data: session } = useSession();
  const company = session?.user?.company;
  const useCompanyBrand = Boolean(company?.use_company_brand);

  if (useCompanyBrand) {
    return (
      <Link href="/dashboard" className="sidebar-brand group">
        {company.logo_url ? (
          <img
            src={company.logo_url}
            alt={company.name}
            className="sidebar-brand-mark h-10 w-10 rounded-lg bg-white object-contain shadow-none"
          />
        ) : (
          <span className="sidebar-brand-mark flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">
            {companyInitials(company.name)}
          </span>
        )}
        <div className="min-w-0 group-data-[collapsible=icon]:hidden">
          <p className="sidebar-brand-title truncate">{company.name || t("company_portal", { defaultMessage: "Company portal" })}</p>
          <p className="sidebar-brand-subtitle">{t("company_portal", { defaultMessage: "Company portal" })}</p>
        </div>
      </Link>
    );
  }

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

export function PoweredByEmara({ compact = false }) {
  return (
    <p className={cn(
      "text-center text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500",
      compact && "group-data-[collapsible=icon]:hidden"
    )}>
      Powered by EMARA Technologies
    </p>
  );
}

function isPathActive(pathname, url) {
  if (pathname === url) return true;
  if (url !== "/" && pathname.startsWith(`${url}/`)) return true;
  return false;
}
