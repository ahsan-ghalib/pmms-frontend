"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PlanForm from "@/containers/platform/plan-form";
import { platformApi } from "@/services/platform/platform-api";
import { apiError } from "@/lib/pmms";

export default function EditPlanPage() {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    platformApi.plan(id)
      .then(setPlan)
      .catch((error) => toast.error(apiError(error, "Failed to load plan")));
  }, [id]);

  if (!plan) return <div className="p-8 text-center text-muted-foreground">Loading plan...</div>;

  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: "Subscriptions", url: "/subscriptions?tab=plans" },
        { name: plan.name, url: "#" },
      ]} />
      <PlanForm plan={plan} />
    </div>
  );
}
