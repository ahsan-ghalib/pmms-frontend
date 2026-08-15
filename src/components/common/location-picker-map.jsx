"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Search, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

const LIBRARIES = ["places"];
const DOHA = { lat: 25.2854, lng: 51.5310 };

const DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#1e1b2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#c4b5fd" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1e1b2e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2e2648" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
];

function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  height = "300px",
  defaultCenter = DOHA,
  searchPlaceholder = "Search for a location...",
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [currentCenter, setCurrentCenter] = useState(defaultCenter);
  const [isDark, setIsDark] = useState(false);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("dark") || root.getAttribute("data-color-mode") === "dark");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class", "data-color-mode"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude))) {
      const position = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
      setMarkerPosition(position);
      setCurrentCenter(position);
    }
  }, [latitude, longitude]);

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const onMapClick = useCallback(async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });

    if (onLocationChange) {
      onLocationChange(lat.toString(), lng.toString());
    }
  }, [onLocationChange]);

  const onAutocompleteLoad = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMarkerPosition({ lat, lng });
        setCurrentCenter({ lat, lng });
        if (map) {
          map.setZoom(15);
          map.panTo({ lat, lng });
        }
        if (onLocationChange) {
          onLocationChange(lat.toString(), lng.toString());
        }
      } else {
        toast.error("No location found for this place");
      }
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.loading("Detecting location...", { id: "location" });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMarkerPosition({ lat, lng });
          setCurrentCenter({ lat, lng });
          if (map) {
            map.setZoom(15);
            map.panTo({ lat, lng });
          }
          if (onLocationChange) {
            onLocationChange(lat.toString(), lng.toString());
          }
          toast.success("Location detected!", { id: "location" });
        },
        (error) => {
          toast.error("Unable to retrieve your location.", { id: "location" });
          console.error(error);
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  if (loadError || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-400" style={{ height }}>
        <MapPin className="h-6 w-6 text-violet-500" />
        <p>Google Maps could not load. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to the frontend env.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5" style={{ height }}>
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search Input Box & Get Location Button */}
      <div className="flex gap-2 relative">
        <div className="relative w-full">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
            <Search className="h-4 w-4" />
          </div>
          <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
            <Input
              type="text"
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border-slate-200 bg-white pl-9 shadow-sm transition-all focus-visible:ring-violet-500/20 dark:border-white/10 dark:bg-slate-900"
            />
          </Autocomplete>
        </div>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm transition-colors hover:bg-violet-700"
          title="Use my location"
        >
          <MapPin className="h-4 w-4" />
        </button>
      </div>

      <div className="relative z-0 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-white/10" style={{ height }}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={currentCenter}
          zoom={markerPosition ? 15 : 11}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={onMapClick}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            clickableIcons: false,
            styles: isDark ? DARK_MAP_STYLES : undefined,
          }}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
              animation={window.google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
}

export default memo(LocationPickerMap, (prevProps, nextProps) => {
  return prevProps.latitude === nextProps.latitude && prevProps.longitude === nextProps.longitude;
});
