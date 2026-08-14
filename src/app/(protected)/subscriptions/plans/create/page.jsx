"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PlanForm from "@/containers/platform/plan-form";

export default function CreatePlanPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: "Subscriptions", url: "/subscriptions" },
        { name: "New plan", url: "/subscriptions/plans/create" },
      ]} />
      <PlanForm />
    </div>
  );
}
