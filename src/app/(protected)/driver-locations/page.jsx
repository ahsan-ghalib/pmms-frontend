import React from "react";
import { DriverLocationsMap } from "@/containers/drivers/driver-locations-map";

export const metadata = {
  title: "Driver Locations | Dashboard",
  description: "View real-time locations of all active drivers on the map.",
};

export default function DriverLocationsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Driver Locations</h2>
      </div>
      <div className="h-[calc(100vh-200px)] w-full">
        <DriverLocationsMap />
      </div>
    </div>
  );
}
