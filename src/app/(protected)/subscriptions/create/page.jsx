"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import SubscriptionForm from "@/containers/platform/subscription-form";

export default function CreateSubscriptionPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[
        { name: "Subscriptions", url: "/subscriptions" },
        { name: "Assign subscription", url: "/subscriptions/create" },
      ]} />
      <SubscriptionForm />
    </div>
  );
}
