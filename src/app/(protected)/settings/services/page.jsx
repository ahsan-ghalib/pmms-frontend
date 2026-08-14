"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import ServicesPage from "@/containers/settings/services-page";
import { useT } from "@/lib/use-t";

export default function ServicesSettingsPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("settings", { defaultMessage: "Settings" }), url: "/settings/services" },
        { name: t("services", { defaultMessage: "Services" }), url: "/settings/services" },
      ]} />
      <ServicesPage />
    </div>
  );
}
