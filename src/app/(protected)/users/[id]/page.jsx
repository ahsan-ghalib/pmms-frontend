"use client";
import { UserDetails } from "@/containers/users";
import { useParams } from "next/navigation";

export default function UserDetailsPage() {
  const params = useParams();
  const userId = parseInt(params.id);

  return (
    <div className="container mx-auto py-6">
      <UserDetails userId={userId} />
    </div>
  );
}