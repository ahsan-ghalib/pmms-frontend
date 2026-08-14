"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import UserAccountForm from "@/containers/users/user-account-form";

export default function CreateUserPage() {
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: "Users", url: "/users" }, { name: "New user", url: "/users/create" }]} />
      <UserAccountForm />
    </div>
  );
}
