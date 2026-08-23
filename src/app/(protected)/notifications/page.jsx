"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import NotificationInboxPage from "@/containers/notifications/inbox-page";
import { useT } from "@/lib/use-t";

export default function NotificationsRoute() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: t("notifications", { defaultMessage: "Notifications" }), url: "/notifications" }]} />
      <NotificationInboxPage />
    </div>
  );
}
