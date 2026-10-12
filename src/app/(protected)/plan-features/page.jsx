"use client";

import SuperAdminOnly from "@/components/pmms/super-admin-only";
import PlanFeaturesPage from "@/containers/platform/plan-features-page";

export default function Page() {
  return (
    <SuperAdminOnly redirectTo="/dashboard">
      <PlanFeaturesPage />
    </SuperAdminOnly>
  );
}
