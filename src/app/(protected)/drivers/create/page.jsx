"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import DriverForm from "@/containers/drivers/driver-form";
import { driversAPI } from "@/services/drivers/drivers-api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateDriverPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const breadcrumbData = [
    { name: "Drivers", url: "/drivers" },
    { name: "Create Driver", url: "/drivers/create" },
  ];

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await driversAPI.create(data);
      toast.success("Driver created successfully");
      router.push("/drivers");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create driver");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <BreadcrumbComponent data={breadcrumbData} />
      <div className="mx-auto max-w-4xl mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Driver</CardTitle>
          </CardHeader>
          <CardContent>
            <DriverForm onSubmit={onSubmit} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
