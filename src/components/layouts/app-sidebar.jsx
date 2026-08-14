"use client";

import * as React from "react";
import {
  Users,
  Landmark,
  ClipboardList,
  Settings2,
  Sparkles,
} from "lucide-react";
import { NavMain } from "@/components/layouts/nav-main";
import { NavUser } from "@/components/layouts/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarBrand, NavDashboard } from "@/components/layouts/sidebar-brand";
import { useSession } from "next-auth/react";
import { useT } from "@/lib/use-t";
import { canSeeModule } from "@/lib/permissions/role-access";

export function useNavItems() {
  const t = useT("common");

  return [
    {
      title: t("sidebar_operations", { defaultMessage: "Operations" }),
      url: "/work-orders",
      icon: ClipboardList,
      module: "work-orders",
      items: [
        { title: t("sidebar_work_orders", { defaultMessage: "Work Orders" }), url: "/work-orders", module: "work-orders" },
        { title: t("sidebar_duty", { defaultMessage: "Duty & My Jobs" }), url: "/duty", module: "duty" },
        { title: t("sidebar_live_map", { defaultMessage: "Live Map" }), url: "/live-map", module: "live-map" },
        { title: t("sidebar_complaints", { defaultMessage: "Complaints" }), url: "/complaints", module: "complaints" },
        { title: t("sidebar_pm_schedules", { defaultMessage: "Preventive Maintenance" }), url: "/maintenance-schedules", module: "maintenance-schedules" },
      ],
    },
    {
      title: t("sidebar_portfolio", { defaultMessage: "Portfolio" }),
      url: "/properties",
      icon: Landmark,
      module: "properties",
      items: [
        { title: t("sidebar_properties", { defaultMessage: "Properties" }), url: "/properties", module: "properties" },
        { title: t("sidebar_companies", { defaultMessage: "Companies" }), url: "/companies", module: "companies" },
      ],
    },
    {
      title: t("sidebar_platform", { defaultMessage: "Platform" }),
      url: "/subscriptions",
      icon: Sparkles,
      module: "subscriptions",
      items: [
        { title: t("sidebar_languages", { defaultMessage: "Languages" }), url: "/languages", module: "languages" },
        { title: t("sidebar_subscriptions", { defaultMessage: "Subscriptions" }), url: "/subscriptions", module: "subscriptions" },
        { title: t("sidebar_trials", { defaultMessage: "Trials" }), url: "/trials", module: "trials" },
        { title: t("sidebar_platform_settings", { defaultMessage: "Platform Settings" }), url: "/platform-settings", module: "platform-settings" },
      ],
    },
    {
      title: t("sidebar_people", { defaultMessage: "People" }),
      url: "/users",
      icon: Users,
      module: "users",
      items: [
        { title: t("sidebar_users", { defaultMessage: "Users" }), url: "/users", module: "users" },
      ],
    },
    {
      title: t("sidebar_configuration", { defaultMessage: "Configuration" }),
      url: "/settings/categories",
      icon: Settings2,
      module: "settings",
      items: [
        { title: t("sidebar_categories", { defaultMessage: "Categories" }), url: "/settings/categories", module: "categories" },
        { title: t("sidebar_services", { defaultMessage: "Services" }), url: "/settings/services", module: "services" },
        { title: t("sidebar_wo_settings", { defaultMessage: "Complaint & WO Settings" }), url: "/settings/complaint-settings", module: "settings" },
        { title: t("sidebar_calendar", { defaultMessage: "Working Calendar" }), url: "/settings/working-calendar", module: "calendar" },
        { title: t("sidebar_roles", { defaultMessage: "Roles & Permissions" }), url: "/settings/roles-permissions", module: "roles" },
      ],
    },
  ];
}

export function AppSidebar({ ...props }) {
  const { data: session, status } = useSession();
  const navItems = useNavItems();
  const role = session?.user?.role;

  const user = React.useMemo(() => {
    if (!session?.user) return null;
    return {
      name: session.user.name ?? "PMMS Admin",
      email: session.user.email ?? "",
      avatar: session.user.avatar ?? "/images/avatar.jpg",
    };
  }, [session]);

  const filteredNavItems = React.useMemo(() => {
    return navItems
      .map((item) => {
        if (item.module && !canSeeModule(role, item.module)) return null;
        const items = (item.items || []).filter((sub) => !sub.module || canSeeModule(role, sub.module));
        if (item.items?.length && items.length === 0) return null;
        return { ...item, items };
      })
      .filter(Boolean);
  }, [navItems, role]);

  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="modern-sidebar [&_[data-slot=sidebar-container]]:p-2.5"
      {...props}
    >
      <SidebarHeader className="px-3 pb-2 pt-3">
        <SidebarBrand />
        <div className="mt-3 px-1">
          <NavDashboard />
        </div>
        <div className="sidebar-divider" />
      </SidebarHeader>
      <SidebarContent className="px-1 pb-2">
        <NavMain items={filteredNavItems} />
      </SidebarContent>
      <SidebarFooter className="sidebar-user-card px-3 pb-3 pt-2">
        <NavUser user={user} status={status} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
