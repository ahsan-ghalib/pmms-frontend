"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import UserAccountForm from "@/containers/users/user-account-form";
import { pmmsUsersApi } from "@/services/users/pmms-users-api";
import { apiError } from "@/lib/pmms";

export default function EditUserPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    pmmsUsersApi.show(id).then(setUser).catch((error) => toast.error(apiError(error, "Failed to load user")));
  }, [id]);

  if (!user) return <div className="p-8 text-center text-muted-foreground">Loading user...</div>;

  return (
    <div className="space-y-6">
      <BreadcrumbComponent data={[{ name: "Users", url: "/users" }, { name: user.name, url: "#" }]} />
      <UserAccountForm user={user} />
    </div>
  );
}
