"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import StockLocationsPage from "@/containers/settings/stock-locations-page";
import { useT } from "@/lib/use-t";

export default function StockLocationsSettingsPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("settings", { defaultMessage: "Settings" }), url: "/settings/categories" },
        { name: t("stock_locations", { defaultMessage: "Stock locations" }), url: "/settings/stock-locations" },
      ]} />
      <StockLocationsPage />
    </div>
  );
}
