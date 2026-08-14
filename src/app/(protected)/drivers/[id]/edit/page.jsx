"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BreadcrumbComponent } from "@/components/common/breadcrumb-component";
import DriverForm from "@/containers/drivers/driver-form";
import { driversAPI } from "@/services/drivers/drivers-api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/helper/Loader";

export default function EditDriverPage({ params }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    const fetchDriver = async () => {
      try {
        const response = await driversAPI.getById(params.id);
        setDriver(response.data);
      } catch (error) {
        toast.error("Failed to fetch driver details");
        router.push("/drivers");
      }
    };
    if (params.id) {
      fetchDriver();
    }
  }, [params.id, router]);

  const breadcrumbData = [
    { name: "Drivers", url: "/drivers" },
    { name: "Edit Driver", url: `/drivers/${params.id}/edit` },
  ];

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await driversAPI.update(params.id, data);
      toast.success("Driver updated successfully");
      router.push("/drivers");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update driver");
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
            <CardTitle>Edit Driver</CardTitle>
          </CardHeader>
          <CardContent>
            {!driver ? (
              <div className="flex justify-center p-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <DriverForm initialData={driver} onSubmit={onSubmit} isLoading={isLoading} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
