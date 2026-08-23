"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import BroadcastsPage from "@/containers/notifications/broadcasts-page";
import { useT } from "@/lib/use-t";

export default function BroadcastsRoute() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: t("broadcasts", { defaultMessage: "Broadcasts" }), url: "/broadcasts" }]} />
      <BroadcastsPage />
    </div>
  );
}
