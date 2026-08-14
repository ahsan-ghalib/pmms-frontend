"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Search, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LIBRARIES = ["places"];

function LocationPickerMap({
  latitude,
  longitude,
  onLocationChange,
  height = "300px",
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [currentCenter, setCurrentCenter] = useState({ lat: 33.6844, lng: 73.0479 }); // Default Islamabad
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude))) {
      const position = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
      setMarkerPosition(position);
      setCurrentCenter(position);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {}
      );
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

    toast.success("Location selected");
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

  if (loadError) {
    return (
      <div className="flex items-center justify-center bg-slate-50 border rounded-md text-red-500" style={{ height }}>
        Error loading maps.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-slate-50 border rounded-md" style={{ height }}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
              placeholder="Search for a location..."
              className="pl-9 w-full bg-white shadow-sm border-slate-200 focus-visible:ring-primary/20 transition-all"
            />
          </Autocomplete>
        </div>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="shrink-0 flex items-center justify-center bg-primary text-primary-foreground w-10 h-10 rounded-md shadow-sm hover:bg-primary/90 transition-colors"
          title="Get My Location"
        >
          <MapPin className="h-4 w-4" />
        </button>
      </div>

      {/* Map */}
      <div className="relative w-full rounded-md border shadow-sm overflow-hidden z-0" style={{ height }}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={currentCenter}
          zoom={13}
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
