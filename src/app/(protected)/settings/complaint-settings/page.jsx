"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import ComplaintSettingsForm from "@/containers/settings/complaint-settings";
import { useT } from "@/lib/use-t";

export default function ComplaintSettingsPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: t("settings", { defaultMessage: "Settings" }), url: "/settings/complaint-settings" },
        { name: t("sidebar_wo_settings", { defaultMessage: "Complaint & WO Settings" }), url: "/settings/complaint-settings" },
      ]} />
      <ComplaintSettingsForm />
    </div>
  );
}
