"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import SuperAdminOnly from "@/components/pmms/super-admin-only";
import ServicesPage from "@/containers/settings/services-page";
import { useT } from "@/lib/use-t";

function ServicesSettingsPageContent() {
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

export default function ServicesSettingsPage() {
  return (
    <SuperAdminOnly redirectTo="/settings/categories">
      <ServicesSettingsPageContent />
    </SuperAdminOnly>
  );
}
