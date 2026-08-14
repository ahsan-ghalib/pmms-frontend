"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import LocationHistoryPage from "@/containers/technicians/location-history-page";
import { useT } from "@/lib/use-t";

export default function TechnicianLocationsRoutePage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent
        data={[
          { name: t("live_map_title", { defaultMessage: "Live technician map" }), url: "/live-map" },
          { name: t("route_title", { defaultMessage: "Technician route" }), url: "#" },
        ]}
      />
      <LocationHistoryPage />
    </div>
  );
}
