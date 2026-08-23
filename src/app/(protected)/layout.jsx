import { AppSidebar } from "@/components/layouts/app-sidebar";
import RouteProtection from "@/components/layouts/route-protection";
import AuthAndPermissionWrapper from "@/components/layouts/auth-and-permission-wrapper";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "sonner";
import LogoutButton from "@/components/layouts/logout";
import { PermissionsInitializer } from "@/components/layouts/permissions-initializer";
import { LanguageToggle } from "@/components/layouts/language-toggle";
import SessionLocaleSync from "@/components/layouts/session-locale-sync";
import { AppHeaderTitle } from "@/components/layouts/app-header-title";
import { SocketIndicator } from "@/components/layouts/socket-indicator";
import { ThemeToggle } from "@/components/layouts/theme-toggle";
import DutyTrackingProvider from "@/components/technicians/duty-tracking-provider";
import "../admin-glass.css";

export default async function ProtectedLayout({ children }) {
  return (
    <RouteProtection>
      <PermissionsInitializer />
      <SessionLocaleSync />
      <AuthAndPermissionWrapper>
        <div className="admin-shell">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-md focus:bg-white focus:px-3 focus:py-2">
            Skip to main content
          </a>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="admin-main min-w-0">
              <header className="glass-header sticky top-0 z-20 flex items-center justify-between px-4 py-3 md:px-6">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="glass-btn size-9 rounded-xl text-muted-foreground hover:text-foreground" />
                  <AppHeaderTitle />
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <SocketIndicator />
                  <ThemeToggle />
                  <LanguageToggle />
                  <LogoutButton className="glass-btn flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-red-600" />
                </div>
              </header>

              <div id="main-content" tabIndex={-1} className="admin-content flex flex-1 flex-col px-4 py-4 md:px-6 md:py-5 min-w-0 w-full overflow-x-hidden">
                <DutyTrackingProvider>
                  {children}
                </DutyTrackingProvider>
                <Toaster position="top-right" />
              </div>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </AuthAndPermissionWrapper>
    </RouteProtection>
  );
}
