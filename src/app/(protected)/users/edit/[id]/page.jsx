"use client";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import { UserForm } from "@/containers/users";
import { useParams } from "next/navigation";

export default function EditUserPage() {
  const params = useParams();
  const userId = parseInt(params.id);

  const breadcrumbData = [
    { name: "Users", url: "/users" },
    { name: "Edit User", url: `/users/edit/${userId}` },
  ];

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <div className="w-full mx-auto py-6">
        <UserForm userId={userId} mode="edit" />
      </div>
    </>
  );
}