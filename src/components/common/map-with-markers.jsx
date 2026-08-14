"use client";

import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { AlertCircle, Loader2 } from "lucide-react";

export default function MapWithMarkers({
  markers = [], // Array of { id, lat, lng, data }
  onMarkerClick,
  center = null,
  defaultZoom = 12,
  height = "100%",
  minHeight = "600px",
  className = "",
  autoFitBounds = true,
  renderInfoWindow, // Function that takes (markerData, onClose) and returns React Node
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "", // Ensure this is set in .env.local
  });

  const [map, setMap] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(center || { lat: 25.2048, lng: 55.2708 }); // Default Dubai
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Get current location on mount if no center is provided
  useEffect(() => {
    if (!center && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
        }
      );
    }
  }, [center]);

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback(mapInstance) {
    setMap(null);
  }, []);

  // Fit bounds when markers change
  useEffect(() => {
    if (autoFitBounds && map && markers.length > 0 && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidCoords = false;
      
      markers.forEach((marker) => {
        const lat = parseFloat(marker.lat);
        const lng = parseFloat(marker.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend({ lat, lng });
          hasValidCoords = true;
        }
      });
      
      if (hasValidCoords) {
        map.fitBounds(bounds);
      }
    }
  }, [map, markers, autoFitBounds]);

  if (loadError) {
    return (
      <div 
        className={`flex items-center justify-center w-full bg-slate-50 dark:bg-slate-900 rounded-lg border border-red-200 p-6 text-center ${className}`}
        style={{ height, minHeight }}
      >
        <div className="flex flex-col items-center text-red-500">
          <AlertCircle className="w-10 h-10 mb-2" />
          <p className="font-medium">Error loading Google Maps</p>
          <p className="text-sm text-red-400 mt-1">Please check your API key configuration.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className={`flex items-center justify-center w-full bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border ${className}`}
        style={{ height, minHeight }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ height, minHeight }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={currentLocation}
        zoom={defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {markers.map((marker) => {
          const lat = parseFloat(marker.lat);
          const lng = parseFloat(marker.lng);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker
              key={marker.id}
              position={{ lat, lng }}
              onClick={() => {
                setSelectedMarker(marker);
                if (onMarkerClick) onMarkerClick(marker.data);
              }}
              icon={
                window.google
                  ? {
                      url: marker.iconUrl || "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                      scaledSize: new window.google.maps.Size(32, 32),
                    }
                  : undefined
              }
            />
          );
        })}

        {selectedMarker && renderInfoWindow && (
          <InfoWindow
            position={{
              lat: parseFloat(selectedMarker.lat),
              lng: parseFloat(selectedMarker.lng),
            }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            {renderInfoWindow(selectedMarker.data, () => setSelectedMarker(null))}
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
