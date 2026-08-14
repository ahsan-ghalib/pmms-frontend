"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import SubscriptionsHub from "@/containers/platform/subscriptions-hub";

export default function SubscriptionsRoutePage() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: "Subscriptions", url: "/subscriptions" }]} />
      <SubscriptionsHub />
    </div>
  );
}
