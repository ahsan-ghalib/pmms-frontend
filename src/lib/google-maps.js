"use client";

import { useJsApiLoader } from "@react-google-maps/api";

// The Google Maps script loads once per page, so every map must request the same id and libraries.
const LIBRARIES = ["places", "drawing", "geometry"];

export function useGoogleMaps() {
  return useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });
}
