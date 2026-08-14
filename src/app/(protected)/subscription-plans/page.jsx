import { redirect } from "next/navigation";

export default function SubscriptionPlansRedirectPage() {
  redirect("/subscriptions?tab=plans");
}
