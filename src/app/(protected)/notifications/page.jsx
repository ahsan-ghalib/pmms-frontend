import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import NotificationComponent from "@/containers/notifications/notification";

export default function NotificationsPage() {
  const breadcrumbData = [{ name: "Notifications", url: "/notifications" }];

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <NotificationComponent />
    </>
  );
}
