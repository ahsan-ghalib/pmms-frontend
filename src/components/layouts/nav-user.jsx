"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, ChevronsUpDown, LogOut, User, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { clearUserPermissions } from "@/lib/permissions/permission-utils";

export function NavUser({ user, status = "unauthenticated" }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const isLoading = status === "loading";

  const [impersonated, setImpersonated] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("soouqlive_impersonate_user");
      if (!raw) {
        setImpersonated(null);
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) {
        setImpersonated(parsed);
      }
    } catch {
      setImpersonated(null);
    }
  }, []);

  const baseName = user?.name ?? (isLoading ? "Loading…" : "Soouq Live Admin");
  const baseEmail = user?.email ?? "";

  const displayName = impersonated?.name || baseName;
  const displayEmail = impersonated?.email || baseEmail;
  const avatarSrc = user?.avatar ?? "/images/avatar.jpg";

  const handleLogout = async () => {
    try {
      const { default: axiosInstance } = await import("@/lib/axios");
      // Call backend to revoke sanctum token
      await axiosInstance.post("/logout").catch((err) => {
        console.warn("Backend logout failed or token already revoked", err);
      });

      const { signOut } = await import("next-auth/react");
      if (typeof window !== "undefined") {
        localStorage.removeItem("soouqlive_impersonate_token");
        localStorage.removeItem("soouqlive_impersonate_user");
        localStorage.removeItem("persist:auth");
        localStorage.removeItem("authUser");
        localStorage.removeItem("soouqlive_permissions");
        clearUserPermissions();
      }
      await signOut({
        callbackUrl: "/login",
        redirect: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="h-auto py-2.5">
              <Avatar className="size-9 rounded-xl ring-2 ring-violet-400/30">
                <AvatarImage src={avatarSrc} alt={displayName} />
                <AvatarFallback className="rounded-xl bg-violet-600/30 text-white">
                  <User className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-white">
                  {displayName}
                  {impersonated ? (
                    <span className="ms-1 text-[10px] font-normal text-amber-400">
                      (impersonating)
                    </span>
                  ) : null}
                </span>
                {displayEmail ? (
                  <span className="truncate text-xs text-white/45">{displayEmail}</span>
                ) : null}
              </div>
              <ChevronsUpDown className="ms-auto size-4 shrink-0 text-white/35" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 w-(--radix-dropdown-menu-trigger-width) rounded-xl border-white/10 bg-slate-900/95 text-white backdrop-blur-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                <Avatar className="size-9 rounded-xl">
                  <AvatarImage src={avatarSrc} alt={displayName} />
                  <AvatarFallback className="rounded-xl bg-violet-600/30">
                    <User className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  {displayEmail ? (
                    <span className="truncate text-xs text-white/50">{displayEmail}</span>
                  ) : null}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuGroup>
              <Link href="/profile" className="w-full">
                <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
                  <BadgeCheck className="text-violet-400 mr-2" />
                  Account
                </DropdownMenuItem>
              </Link>
              <Link href="/settings" className="w-full">
                <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
                  <Settings className="text-violet-400 mr-2" />
                  Settings
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handleLogout();
              }}
              className="cursor-pointer text-rose-400 focus:bg-rose-500/15 focus:text-rose-300"
            >
              <LogOut className="size-4" />
              <span className="text-sm font-medium">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
