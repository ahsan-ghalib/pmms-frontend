"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import NotificationSettingsPage from "@/containers/settings/notification-settings-page";
import { useT } from "@/lib/use-t";

export default function NotificationSettingsRoute() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("settings", { defaultMessage: "Settings" }), url: "/settings/categories" },
        { name: t("notifications", { defaultMessage: "Notifications" }), url: "/settings/notifications" },
      ]} />
      <NotificationSettingsPage />
    </div>
  );
}
