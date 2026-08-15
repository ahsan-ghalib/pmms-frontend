"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/use-t";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "../ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

export function NavIcon({ icon: Icon }) {
  return <Icon className="nav-line-icon" strokeWidth={1.75} />;
}

function isPathActive(pathname, url) {
  if (!url) return false;
  if (pathname === url) return true;
  if (url !== "/" && pathname.startsWith(`${url}/`)) return true;
  return false;
}

function isGroupActive(pathname, item) {
  if (isPathActive(pathname, item.url)) return true;
  return item.items?.some((sub) => isPathActive(pathname, sub.url)) ?? false;
}

export function NavMain({ items }) {
  const pathname = usePathname();
  const t = useT("common");

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarGroupLabel>
        {t("sidebar_menu", { defaultMessage: "Menu" })}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const groupActive = isGroupActive(pathname, item);

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={groupActive || item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem className={cn(groupActive && "nav-item-active")}>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className="sidebar-nav-btn"
                  >
                    {item.icon && <NavIcon icon={item.icon} />}
                    <span className="truncate">{item.title}</span>
                    <ChevronRight className="sidebar-chevron ms-auto size-3.5 shrink-0" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
                  <SidebarMenuSub className="sidebar-sub">
                    {item.items?.map((subItem) => {
                      const subActive = isPathActive(pathname, subItem.url);

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className={cn(subActive && "nav-sub-active")}
                          >
                            <Link href={subItem.url}>
                              <span className="sidebar-sub-dot" aria-hidden />
                              <span className="truncate">{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
