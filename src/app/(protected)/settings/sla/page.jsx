"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import SlaPoliciesPage from "@/containers/settings/sla-policies-page";
import { useT } from "@/lib/use-t";

export default function SlaSettingsPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("settings", { defaultMessage: "Settings" }), url: "/settings/categories" },
        { name: t("sla_policies", { defaultMessage: "SLA policies" }), url: "/settings/sla" },
      ]} />
      <SlaPoliciesPage />
    </div>
  );
}
