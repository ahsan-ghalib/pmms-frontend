"use client";

import * as React from "react";
import {
  Users,
  Landmark,
  ClipboardList,
  Package,
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
        { title: t("sidebar_reports", { defaultMessage: "Reports" }), url: "/reports", module: "reports" },
        { title: t("sidebar_sla_report", { defaultMessage: "SLA report" }), url: "/reports/sla", module: "sla-report" },
        { title: t("sidebar_notifications", { defaultMessage: "Notifications" }), url: "/notifications", module: "notifications" },
        { title: t("sidebar_broadcasts", { defaultMessage: "Broadcasts" }), url: "/broadcasts", module: "broadcasts" },
        { title: t("sidebar_checklists", { defaultMessage: "Daily checklists" }), url: "/checklists", module: "checklists" },
      ],
    },
    {
      title: t("sidebar_inventory", { defaultMessage: "Inventory" }),
      url: "/inventory",
      icon: Package,
      module: "inventory",
      items: [
        { title: t("sidebar_parts", { defaultMessage: "Parts" }), url: "/inventory", module: "inventory" },
        { title: t("sidebar_stock_logs", { defaultMessage: "Stock logs" }), url: "/inventory/stock", module: "inventory" },
        { title: t("sidebar_purchase_requests", { defaultMessage: "Purchase requests" }), url: "/inventory/purchase-requests", module: "purchase-requests" },
      ],
    },
    {
      title: t("sidebar_portfolio", { defaultMessage: "Portfolio" }),
      url: "/properties",
      icon: Landmark,
      module: "properties",
      items: [
        { title: t("sidebar_properties", { defaultMessage: "Properties" }), url: "/properties", module: "properties" },
        { title: t("sidebar_assets", { defaultMessage: "Assets" }), url: "/assets", module: "assets" },
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
        { title: t("sidebar_asset_categories", { defaultMessage: "Asset categories" }), url: "/settings/asset-categories", module: "asset-categories" },
        { title: t("sidebar_part_categories", { defaultMessage: "Part categories" }), url: "/settings/part-categories", module: "part-categories" },
        { title: t("sidebar_sla", { defaultMessage: "SLA policies" }), url: "/settings/sla", module: "sla" },
        { title: t("sidebar_notification_settings", { defaultMessage: "Notification templates" }), url: "/settings/notifications", module: "notification-settings" },
        { title: t("sidebar_checklist_settings", { defaultMessage: "Daily checklists" }), url: "/settings/checklists", module: "checklist-settings" },
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
  const t = useT("common");
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
      variant="sidebar"
      className="modern-sidebar"
      {...props}
    >
      <SidebarHeader className="sidebar-header-block">
        <SidebarBrand />
      </SidebarHeader>
      <SidebarContent className="sidebar-scroll">
        <div className="px-2 pt-1">
          <p className="sidebar-section-label group-data-[collapsible=icon]:hidden">
            {t("sidebar_overview", { defaultMessage: "Overview" })}
          </p>
          <NavDashboard />
        </div>
        <div className="sidebar-divider" />
        <NavMain items={filteredNavItems} />
      </SidebarContent>
      <SidebarFooter className="sidebar-user-card">
        <NavUser user={user} status={status} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
