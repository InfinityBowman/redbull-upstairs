import { useRef, useCallback, type ReactNode } from "react";
import Map, { type MapRef, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

const STL_CENTER = { longitude: -90.245, latitude: 38.635 };
const STL_ZOOM = 11.5;

interface MapProviderProps {
  children?: ReactNode;
  className?: string;
  interactive?: boolean;
  zoom?: number;
  center?: { longitude: number; latitude: number };
  onMapLoad?: (map: mapboxgl.Map) => void;
}

export function MapProvider({
  children,
  className = "h-[600px] w-full rounded-lg",
  interactive = true,
  zoom = STL_ZOOM,
  center = STL_CENTER,
  onMapLoad,
}: MapProviderProps) {
  const mapRef = useRef<MapRef>(null);

  const handleLoad = useCallback(() => {
    if (mapRef.current && onMapLoad) {
      onMapLoad(mapRef.current.getMap());
    }
  }, [onMapLoad]);

  return (
    <div className={className}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          ...center,
          zoom,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        interactive={interactive}
        onLoad={handleLoad}
      >
        <NavigationControl position="top-right" />
        {children}
      </Map>
    </div>
  );
}

export { STL_CENTER, STL_ZOOM };
