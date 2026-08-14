"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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

const ICON_GRADIENTS = [
  "bg-gradient-to-br from-violet-500 to-purple-700",
  "bg-gradient-to-br from-blue-500 to-cyan-600",
  "bg-gradient-to-br from-emerald-500 to-teal-600",
  "bg-gradient-to-br from-orange-500 to-amber-600",
  "bg-gradient-to-br from-rose-500 to-pink-600",
  "bg-gradient-to-br from-indigo-500 to-violet-600",
  "bg-gradient-to-br from-sky-500 to-blue-600",
  "bg-gradient-to-br from-fuchsia-500 to-purple-600",
  "bg-gradient-to-br from-lime-500 to-green-600",
  "bg-gradient-to-br from-red-500 to-orange-600",
];

export function NavIcon({ icon: Icon, index }) {
  const gradient = ICON_GRADIENTS[index % ICON_GRADIENTS.length];

  return (
    <div className={cn("nav-icon-box", gradient)}>
      <Icon className="size-4 text-white drop-shadow-sm" strokeWidth={2.25} />
    </div>
  );
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

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        {items.map((item, index) => {
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
                    className="h-11 rounded-xl px-2.5 transition-all duration-200"
                  >
                    {item.icon && <NavIcon icon={item.icon} index={index} />}
                    <span className="truncate text-[13px]">{item.title}</span>
                    <ChevronRight className="ms-auto size-4 shrink-0 text-white/30 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="animate-in slide-in-from-top-1 duration-200">
                  <SidebarMenuSub className="mx-0 mt-0.5 mb-1 py-0.5">
                    {item.items?.map((subItem) => {
                      const subActive = isPathActive(pathname, subItem.url);

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className={cn(subActive && "nav-sub-active")}
                          >
                            <Link href={subItem.url}>
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
