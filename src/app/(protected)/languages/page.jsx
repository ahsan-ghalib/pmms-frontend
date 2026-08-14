"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import LanguagesPage from "@/containers/platform/languages-page";

export default function LanguagesRoutePage() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: "Languages", url: "/languages" }]} />
      <LanguagesPage />
    </div>
  );
}
