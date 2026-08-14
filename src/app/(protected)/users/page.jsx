"use client";

import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import PmmsUsersTable from "@/containers/users/pmms-users-table";
import { useT } from "@/lib/use-t";

export default function UsersPage() {
  const t = useT("common");
  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: t("users", { defaultMessage: "Users" }), url: "/users" }]} />
      <PmmsUsersTable />
    </div>
  );
}
