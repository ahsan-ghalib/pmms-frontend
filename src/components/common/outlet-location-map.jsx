"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import dynamic from "next/dynamic";

const MapWithMarkers = dynamic(() => import("@/components/common/map-with-markers"), { ssr: false });

export default function OutletLocationMap({ latitude, longitude, outletName, height = "400px" }) {
  const hasCoordinates = latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));

  return (
    <Card className="h-full border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50/50 border-b pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-semibold">Location</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!hasCoordinates ? (
          <div 
            className="flex flex-col items-center justify-center bg-slate-50/50 text-slate-400"
            style={{ height }}
          >
            <MapPin className="h-10 w-10 mb-2 opacity-20" />
            <p>No location set</p>
          </div>
        ) : (
          <MapWithMarkers
            height={height}
            minHeight={height}
            markers={[
              {
                id: "outlet",
                lat: parseFloat(latitude),
                lng: parseFloat(longitude),
                data: { name: outletName },
              },
            ]}
            center={{ lat: parseFloat(latitude), lng: parseFloat(longitude) }}
            autoFitBounds={false}
            defaultZoom={15}
            renderInfoWindow={(data) => (
              <div className="p-2 min-w-[150px]">
                <h4 className="font-semibold text-slate-800 dark:text-white">{data.name || "Selected Location"}</h4>
              </div>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}
