"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import UserInfoTab from "@/components/profile/UserInfoTab";
import VendorActivityTab from "@/components/profile/VendorActivityTab";
import VendorBusinessTab from "@/components/profile/VendorBusinessTab";
import VendorLocationTab from "@/components/profile/VendorLocationTab";
import VendorTablesTab from "@/components/profile/VendorTablesTab";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [vendorData, setVendorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isVendor = session?.user?.role === "vendor";

  useEffect(() => {
    if (status === "loading") return;
    
    if (isVendor && session?.user?.id) {
      fetchVendorDetails();
    } else {
      setIsLoading(false);
    }
  }, [status, isVendor, session]);

  const fetchVendorDetails = async () => {
    try {
      const response = await axiosInstance.get("/vendor/profile");
      if (response.data && response.data.data) {
        setVendorData(response.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load vendor details.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="user-info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="user-info">User Information</TabsTrigger>
          {isVendor && <TabsTrigger value="activity">Activity</TabsTrigger>}
          {isVendor && <TabsTrigger value="business">Business</TabsTrigger>}
          {isVendor && <TabsTrigger value="location">Location</TabsTrigger>}
          {isVendor && vendorData?.has_table_booking && <TabsTrigger value="tables">Tables</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="user-info">
          <UserInfoTab user={session?.user} />
        </TabsContent>

        {isVendor && (
          <>
            <TabsContent value="activity">
              <VendorActivityTab vendor={vendorData} />
            </TabsContent>
            <TabsContent value="business">
              <VendorBusinessTab vendor={vendorData} />
            </TabsContent>
            <TabsContent value="location">
              <VendorLocationTab vendor={vendorData} />
            </TabsContent>
            {vendorData?.has_table_booking && (
              <TabsContent value="tables">
                <VendorTablesTab />
              </TabsContent>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}
