"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import { GoogleMap, useJsApiLoader, DrawingManager, Polygon, Circle, Rectangle } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Trash2, Save, Loader2, Circle as CircleIcon, Square, Hexagon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LIBRARIES = ["drawing", "geometry", "places"];

function CoverageAreaMap({
  outlet,
  onSaveCoverage,
  isSaving = false,
  showSaveButton = true,
  readOnly = false,
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState(null);
  const [drawnShapes, setDrawnShapes] = useState([]);
  const [currentCenter, setCurrentCenter] = useState({ lat: 33.6844, lng: 73.0479 }); // Default Islamabad

  useEffect(() => {
    // If outlet has coordinates, center map there
    if (outlet?.latitude && outlet?.longitude) {
      setCurrentCenter({
        lat: parseFloat(outlet.latitude),
        lng: parseFloat(outlet.longitude),
      });
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
  }, [outlet]);

  // Load existing coverage area
  useEffect(() => {
    if (outlet?.coverage_area && Array.isArray(outlet.coverage_area)) {
      const shapes = outlet.coverage_area.map((area, index) => {
        return {
          id: `loaded-${index}`,
          type: area.properties?._shapeType || "polygon",
          geoJSON: area,
        };
      });
      setDrawnShapes(shapes);
    }
  }, [outlet?.coverage_area]);

  const onLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onOverlayComplete = (e) => {
    const { type, overlay } = e;
    let geoJSON = null;
    
    if (type === window.google.maps.drawing.OverlayType.POLYGON) {
      const path = overlay.getPath();
      const coordinates = [];
      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push([point.lng(), point.lat()]);
      }
      // Close the polygon
      if (coordinates.length > 0) {
        coordinates.push(coordinates[0]);
      }
      
      geoJSON = {
        type: "Feature",
        properties: { _shapeType: "polygon" },
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        }
      };
    } else if (type === window.google.maps.drawing.OverlayType.CIRCLE) {
      const center = overlay.getCenter();
      const radius = overlay.getRadius();
      
      geoJSON = {
        type: "Feature",
        properties: {
          _shapeType: "circle",
          _center: [center.lng(), center.lat()],
          _radius: radius,
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            (() => {
              const points = [];
              const numPoints = 64;
              for (let i = 0; i <= numPoints; i++) {
                const angle = (i / numPoints) * 2 * Math.PI;
                const latOffset = (radius / 111320) * Math.cos(angle);
                const lngOffset = (radius / (111320 * Math.cos((center.lat() * Math.PI) / 180))) * Math.sin(angle);
                points.push([center.lng() + lngOffset, center.lat() + latOffset]);
              }
              return points;
            })(),
          ],
        },
      };
    } else if (type === window.google.maps.drawing.OverlayType.RECTANGLE) {
      const bounds = overlay.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      geoJSON = {
        type: "Feature",
        properties: { _shapeType: "rectangle" },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [sw.lng(), sw.lat()],
            [ne.lng(), sw.lat()],
            [ne.lng(), ne.lat()],
            [sw.lng(), ne.lat()],
            [sw.lng(), sw.lat()]
          ]],
        }
      };
    }

    // Remove the native Google Maps overlay because we will render it via React state
    overlay.setMap(null);

    if (geoJSON) {
      const newShape = {
        id: Date.now().toString(),
        type: type,
        geoJSON,
      };

      setDrawnShapes(prev => {
        const updated = [...prev, newShape];
        if (!showSaveButton && onSaveCoverage) {
          setTimeout(() => {
            onSaveCoverage(updated.map(s => s.geoJSON));
          }, 0);
        }
        return updated;
      });
      toast.success(`${type} drawn successfully`);
    }
  };

  const removeShape = (id) => {
    setDrawnShapes(prev => {
      const updated = prev.filter(shape => shape.id !== id);
      if (!showSaveButton && onSaveCoverage) {
        setTimeout(() => {
          onSaveCoverage(updated.map(s => s.geoJSON));
        }, 0);
      }
      return updated;
    });
  };

  const clearAllShapes = () => {
    setDrawnShapes([]);
    if (!showSaveButton && onSaveCoverage) {
      onSaveCoverage([]);
    }
    toast.success("All shapes cleared");
  };

  const handleSave = () => {
    if (onSaveCoverage) {
      onSaveCoverage(drawnShapes.map(s => s.geoJSON));
      toast.success("Coverage area saved");
    }
  };

  const getShapeIcon = (type) => {
    if (type === "circle" || type === window.google?.maps?.drawing?.OverlayType?.CIRCLE) return <CircleIcon className="h-4 w-4" />;
    if (type === "rectangle" || type === window.google?.maps?.drawing?.OverlayType?.RECTANGLE) return <Square className="h-4 w-4" />;
    return <Hexagon className="h-4 w-4" />;
  };

  const getShapeName = (type) => {
    if (type === "circle" || type === window.google?.maps?.drawing?.OverlayType?.CIRCLE) return "Circle Area";
    if (type === "rectangle" || type === window.google?.maps?.drawing?.OverlayType?.RECTANGLE) return "Rectangular Area";
    return "Custom Polygon";
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center bg-slate-50 border rounded-md text-red-500 h-[500px]">
        Error loading maps.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-slate-50 border rounded-md h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="shadow-sm border-slate-200 h-full flex flex-col">
      <CardHeader className="bg-slate-50/50 border-b pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                Delivery Coverage Area
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {readOnly
                  ? "View delivery zones for this outlet"
                  : "Draw shapes on the map to define delivery zones"}
              </p>
            </div>
          </div>
          {showSaveButton && !readOnly && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllShapes}
                disabled={drawnShapes.length === 0 || isSaving}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Coverage
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col md:flex-row h-[500px] overflow-hidden">
        {/* Sidebar list of shapes */}
        <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-200 bg-white shadow-sm z-10 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Coverage Zones
            </span>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:text-slate-300">
              {drawnShapes.length} {drawnShapes.length === 1 ? "zone" : "zones"}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {drawnShapes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4 text-slate-400">
                <Hexagon className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">
                  {readOnly
                    ? "No coverage areas defined"
                    : "Use the map tools to draw delivery zones"}
                </p>
              </div>
            ) : (
              drawnShapes.map((shape, index) => (
                <div
                  key={shape.id || index}
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md shrink-0">
                      {getShapeIcon(shape.type)}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {getShapeName(shape.type)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Zone {index + 1}
                      </span>
                    </div>
                  </div>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 hover:bg-red-50"
                      onClick={() => removeShape(shape.id)}
                      title="Remove zone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map */}
        <div className="relative flex-1 h-full z-0">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={currentCenter}
            zoom={13}
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
            {/* Draw existing shapes */}
            {drawnShapes.map((shape) => {
              if (shape.type === "circle" || shape.geoJSON.properties?._shapeType === "circle") {
                const center = shape.geoJSON.properties._center;
                return (
                  <Circle
                    key={shape.id}
                    center={{ lat: center[1], lng: center[0] }}
                    radius={shape.geoJSON.properties._radius}
                    options={{
                      fillColor: "#3388ff",
                      fillOpacity: 0.3,
                      strokeColor: "#3388ff",
                      strokeWeight: 2,
                    }}
                  />
                );
              } else {
                // Polygon or Rectangle (treated as Polygon via coordinates)
                const coordinates = shape.geoJSON.geometry.coordinates[0];
                if (!coordinates) return null;
                const path = coordinates.map(c => ({ lat: c[1], lng: c[0] }));
                return (
                  <Polygon
                    key={shape.id}
                    path={path}
                    options={{
                      fillColor: "#3388ff",
                      fillOpacity: 0.3,
                      strokeColor: "#3388ff",
                      strokeWeight: 2,
                    }}
                  />
                );
              }
            })}

            {/* Drawing Manager */}
            {!readOnly && (
              <DrawingManager
                onOverlayComplete={onOverlayComplete}
                options={{
                  drawingControl: true,
                  drawingControlOptions: {
                    position: window.google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: [
                      window.google.maps.drawing.OverlayType.POLYGON,
                      window.google.maps.drawing.OverlayType.RECTANGLE,
                      window.google.maps.drawing.OverlayType.CIRCLE,
                    ],
                  },
                  polygonOptions: {
                    fillColor: "#3388ff",
                    fillOpacity: 0.3,
                    strokeColor: "#3388ff",
                    strokeWeight: 2,
                  },
                  rectangleOptions: {
                    fillColor: "#3388ff",
                    fillOpacity: 0.3,
                    strokeColor: "#3388ff",
                    strokeWeight: 2,
                  },
                  circleOptions: {
                    fillColor: "#3388ff",
                    fillOpacity: 0.3,
                    strokeColor: "#3388ff",
                    strokeWeight: 2,
                  },
                }}
              />
            )}
          </GoogleMap>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(CoverageAreaMap, (prevProps, nextProps) => {
  return (
    prevProps.outlet?.id === nextProps.outlet?.id &&
    prevProps.isSaving === nextProps.isSaving &&
    prevProps.readOnly === nextProps.readOnly &&
    JSON.stringify(prevProps.outlet?.coverage_area) === JSON.stringify(nextProps.outlet?.coverage_area)
  );
});
