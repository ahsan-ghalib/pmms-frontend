"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import LiveMapPage from "@/containers/technicians/live-map-page";
import { useT } from "@/lib/use-t";

export default function LiveMapRoutePage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: t("live_map_title", { defaultMessage: "Live technician map" }), url: "/live-map" }]} />
      <LiveMapPage />
    </div>
  );
}
