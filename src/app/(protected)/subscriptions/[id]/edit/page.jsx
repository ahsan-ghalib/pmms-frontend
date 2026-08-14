"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import SubscriptionForm from "@/containers/platform/subscription-form";
import { platformApi } from "@/services/platform/platform-api";
import { apiError } from "@/lib/pmms";

export default function EditSubscriptionPage() {
  const { id } = useParams();
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    platformApi.subscription(id)
      .then(setSubscription)
      .catch((error) => toast.error(apiError(error, "Failed to load subscription")));
  }, [id]);

  if (!subscription) return <div className="p-8 text-center text-muted-foreground">Loading subscription...</div>;

  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: "Subscriptions", url: "/subscriptions" },
        { name: subscription.company_name || "Edit", url: "#" },
      ]} />
      <SubscriptionForm subscription={subscription} />
    </div>
  );
}
