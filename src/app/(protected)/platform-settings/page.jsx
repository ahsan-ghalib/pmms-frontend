"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PlatformSettingsPage from "@/containers/platform/platform-settings-page";

export default function PlatformSettingsRoutePage() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: "Platform settings", url: "/platform-settings" }]} />
      <PlatformSettingsPage />
    </div>
  );
}
