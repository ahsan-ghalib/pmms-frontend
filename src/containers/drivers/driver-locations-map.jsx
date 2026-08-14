"use client";

import React, { useEffect, useState, useMemo } from "react";
import { driversAPI } from "@/services/drivers/drivers-api";
import { Loader2, User, Phone, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import dynamic from "next/dynamic";

const MapWithMarkers = dynamic(
  () => import("@/components/common/map-with-markers"),
  { ssr: false }
);

export function DriverLocationsMap() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = async () => {
    try {
      const response = await driversAPI.getLocations();
      setDrivers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch driver locations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const markers = useMemo(() => {
    return drivers
      .filter((d) => d.latest_location?.latitude && d.latest_location?.longitude)
      .map((driver) => ({
        id: driver.id.toString(),
        lat: driver.latest_location.latitude,
        lng: driver.latest_location.longitude,
        data: driver,
      }));
  }, [drivers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full min-h-[600px] bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[600px] border rounded-lg overflow-hidden shadow-sm">
      <MapWithMarkers
        markers={markers}
        className="rounded-lg"
        renderInfoWindow={(driver, onClose) => (
          <div className="p-1 max-w-[250px] text-slate-900 dark:text-white">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b">
              <Avatar className="h-10 w-10">
                <AvatarImage src={driver.user?.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-sm leading-none mb-1">
                  {driver.user?.first_name} {driver.user?.last_name}
                </h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {driver.user?.phone || 'No phone'}
                </div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <span className="flex items-center gap-1 text-green-600 font-medium text-xs bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium capitalize">{driver.driver_type?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Last Ping:</span>
                <span className="font-medium text-xs">
                  {driver.latest_location ? new Date(driver.latest_location.recorded_at).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}
