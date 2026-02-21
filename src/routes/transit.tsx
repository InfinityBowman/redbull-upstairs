import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Source, Layer, Popup } from "react-map-gl/mapbox";
import { MapProvider } from "@/components/map/MapProvider";
import { KpiCard } from "@/components/KpiCard";
import { computeEquityGaps, haversine, polygonCentroid } from "@/lib/equity";
import { equitySeverity } from "@/lib/colors";
import { cn } from "@/lib/utils";
import type {
  GeoJSONCollection,
  FoodDesertProperties,
  TransitRoute,
  StopStats,
  EquityGapResult,
} from "@/lib/types";

export const Route = createFileRoute("/transit")({ component: TransitPage });

interface LayerVisibility {
  foodDesert: boolean;
  nonDesert: boolean;
  stops: boolean;
  routes: boolean;
  grocery: boolean;
  walkshed: boolean;
}

function TransitPage() {
  const [stopsData, setStopsData] = useState<GeoJSONCollection | null>(null);
  const [routesData, setRoutesData] = useState<TransitRoute[] | null>(null);
  const [shapesData, setShapesData] = useState<GeoJSONCollection | null>(null);
  const [foodDesertData, setFoodDesertData] = useState<GeoJSONCollection<FoodDesertProperties> | null>(null);
  const [groceryData, setGroceryData] = useState<GeoJSONCollection<{ name: string; chain: string }> | null>(null);
  const [stopStatsData, setStopStatsData] = useState<Record<string, StopStats> | null>(null);

  const [layers, setLayers] = useState<LayerVisibility>({
    foodDesert: true,
    nonDesert: true,
    stops: true,
    routes: true,
    grocery: true,
    walkshed: true,
  });

  useEffect(() => {
    Promise.all([
      fetch("/data/stops.geojson").then((r) => r.json()),
      fetch("/data/routes.json").then((r) => r.json()),
      fetch("/data/shapes.geojson").then((r) => r.json()).catch(() => null),
      fetch("/data/food_deserts.geojson").then((r) => r.json()),
      fetch("/data/grocery_stores.geojson").then((r) => r.json()),
      fetch("/data/stop_stats.json").then((r) => r.json()),
    ]).then(([stops, routes, shapes, deserts, grocery, stats]) => {
      setStopsData(stops);
      setRoutesData(routes);
      setShapesData(shapes);
      setFoodDesertData(deserts);
      setGroceryData(grocery);
      setStopStatsData(stats);
    });
  }, []);

  if (!stopsData || !routesData || !foodDesertData || !groceryData || !stopStatsData) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
        <span className="ml-3">Loading transit data...</span>
      </div>
    );
  }

  return (
    <TransitView
      stopsData={stopsData}
      routesData={routesData}
      shapesData={shapesData}
      foodDesertData={foodDesertData}
      groceryData={groceryData}
      stopStatsData={stopStatsData}
      layers={layers}
      setLayers={setLayers}
    />
  );
}

function TransitView({
  stopsData,
  routesData,
  shapesData,
  foodDesertData,
  groceryData,
  stopStatsData,
  layers,
  setLayers,
}: {
  stopsData: GeoJSONCollection;
  routesData: TransitRoute[];
  shapesData: GeoJSONCollection | null;
  foodDesertData: GeoJSONCollection<FoodDesertProperties>;
  groceryData: GeoJSONCollection<{ name: string; chain: string }>;
  stopStatsData: Record<string, StopStats>;
  layers: LayerVisibility;
  setLayers: (l: LayerVisibility) => void;
}) {
  const gapResults = useMemo(
    () => computeEquityGaps(foodDesertData, stopsData, stopStatsData, groceryData),
    [foodDesertData, stopsData, stopStatsData, groceryData],
  );

  const desertTracts = useMemo(
    () => foodDesertData.features.filter((f) => (f.properties as FoodDesertProperties).lila),
    [foodDesertData],
  );

  const totalPop = useMemo(
    () => desertTracts.reduce((s, f) => s + ((f.properties as FoodDesertProperties).pop || 0), 0),
    [desertTracts],
  );

  // Separate GeoJSON collections for desert / non-desert
  const desertGeo = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: foodDesertData.features.filter((f) => (f.properties as FoodDesertProperties).lila),
    }),
    [foodDesertData],
  );

  const nonDesertGeo = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: foodDesertData.features.filter((f) => !(f.properties as FoodDesertProperties).lila),
    }),
    [foodDesertData],
  );

  // Walkshed circles as GeoJSON
  const walkshedGeo = useMemo(() => {
    const features = stopsData.features.map((stop) => {
      const [lon, lat] = stop.geometry.coordinates as number[];
      return {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "Point" as const,
          coordinates: [lon, lat],
        },
      };
    });
    return { type: "FeatureCollection" as const, features };
  }, [stopsData]);

  // Stops with trip count for sizing
  const stopsWithStats = useMemo(() => {
    const features = stopsData.features.map((stop) => {
      const stats = stopStatsData[stop.properties.stop_id as string] || { trip_count: 0, routes: [] };
      return {
        ...stop,
        properties: {
          ...stop.properties,
          trip_count: stats.trip_count,
          route_count: stats.routes.length,
        },
      };
    });
    return { type: "FeatureCollection" as const, features };
  }, [stopsData, stopStatsData]);

  // Grocery stores as point GeoJSON
  const groceryPointsGeo = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: groceryData.features.map((s) => ({
        type: "Feature" as const,
        properties: s.properties,
        geometry: { type: "Point" as const, coordinates: s.geometry.coordinates },
      })),
    };
  }, [groceryData]);

  // Route color map
  const routeColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    routesData.forEach((r) => { map[r.route_id] = r.route_color || "#a78bfa"; });
    return map;
  }, [routesData]);

  const worstTracts = gapResults.filter((g) => g.score < 30);
  const noAccessTracts = gapResults.filter((g) => !g.groceryAccessible);
  const avgScore = gapResults.length
    ? Math.round(gapResults.reduce((s, g) => s + g.score, 0) / gapResults.length)
    : 0;

  const toggle = (key: keyof LayerVisibility) =>
    setLayers({ ...layers, [key]: !layers[key] });

  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-primary">Transit</span> Equity Mapper
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          St. Louis Metro Area — Transit Access & Food Deserts
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="LILA Census Tracts" value={desertTracts.length} color="danger" />
        <KpiCard label="People in Food Deserts" value={totalPop.toLocaleString()} color="warning" />
        <KpiCard label="Transit Stops" value={stopsData.features.length.toLocaleString()} color="info" />
        <KpiCard label="Bus/Rail Routes" value={routesData.length} color="success" />
      </div>

      {/* Map + Sidebar */}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <MapProvider className="h-[600px] w-full rounded-lg">
            {/* Food desert tracts */}
            {layers.foodDesert && (
              <Source id="food-deserts" type="geojson" data={desertGeo}>
                <Layer
                  id="desert-fill"
                  type="fill"
                  paint={{
                    "fill-color": "#ef4444",
                    "fill-opacity": ["interpolate", ["linear"], ["get", "poverty_rate"], 0, 0.25, 100, 0.7],
                  }}
                />
                <Layer
                  id="desert-outline"
                  type="line"
                  paint={{ "line-color": "#dc2626", "line-width": 2, "line-opacity": 0.8 }}
                />
              </Source>
            )}

            {/* Non-desert tracts */}
            {layers.nonDesert && (
              <Source id="non-deserts" type="geojson" data={nonDesertGeo}>
                <Layer
                  id="non-desert-fill"
                  type="fill"
                  paint={{ "fill-color": "#22c55e", "fill-opacity": 0.15 }}
                />
                <Layer
                  id="non-desert-outline"
                  type="line"
                  paint={{ "line-color": "#16a34a", "line-width": 1.5, "line-opacity": 0.6 }}
                />
              </Source>
            )}

            {/* Walkshed */}
            {layers.walkshed && (
              <Source id="walkshed" type="geojson" data={walkshedGeo}>
                <Layer
                  id="walkshed-circles"
                  type="circle"
                  paint={{
                    "circle-radius": [
                      "interpolate", ["exponential", 2], ["zoom"],
                      10, 3, 14, 60, 18, 400,
                    ],
                    "circle-color": "#60a5fa",
                    "circle-opacity": 0.06,
                    "circle-stroke-width": 0.5,
                    "circle-stroke-color": "#3b82f6",
                    "circle-stroke-opacity": 0.2,
                  }}
                />
              </Source>
            )}

            {/* Routes */}
            {layers.routes && shapesData && (
              <Source id="transit-routes" type="geojson" data={shapesData}>
                <Layer
                  id="route-lines"
                  type="line"
                  paint={{
                    "line-color": "#a78bfa",
                    "line-width": 2.5,
                    "line-opacity": 0.6,
                  }}
                />
              </Source>
            )}

            {/* Transit stops */}
            {layers.stops && (
              <Source id="transit-stops" type="geojson" data={stopsWithStats}>
                <Layer
                  id="stops-circles"
                  type="circle"
                  paint={{
                    "circle-radius": [
                      "interpolate", ["linear"],
                      ["get", "trip_count"],
                      0, 3, 50, 5, 200, 8,
                    ],
                    "circle-color": "#60a5fa",
                    "circle-opacity": 0.7,
                    "circle-stroke-color": "#2563eb",
                    "circle-stroke-width": 1,
                  }}
                />
              </Source>
            )}

            {/* Grocery stores */}
            {layers.grocery && (
              <Source id="grocery-stores" type="geojson" data={groceryPointsGeo}>
                <Layer
                  id="grocery-circles"
                  type="circle"
                  paint={{
                    "circle-radius": 7,
                    "circle-color": "#059669",
                    "circle-stroke-color": "#ecfdf5",
                    "circle-stroke-width": 2,
                  }}
                />
              </Source>
            )}
          </MapProvider>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Layer toggles */}
          <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
            <div className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Map Layers
            </div>
            {([
              { key: "foodDesert" as const, label: "Food Desert Tracts (LILA)", color: "#ef4444" },
              { key: "nonDesert" as const, label: "Non-Desert Tracts", color: "#22c55e" },
              { key: "stops" as const, label: "Transit Stops", color: "#60a5fa" },
              { key: "routes" as const, label: "Transit Routes", color: "#a78bfa" },
              { key: "grocery" as const, label: "Grocery Stores", color: "#34d399" },
              { key: "walkshed" as const, label: "0.5mi Walk Radius", color: "rgba(96,165,250,0.3)" },
            ]).map((item) => (
              <label key={item.key} className="flex cursor-pointer items-center gap-2.5 py-1.5">
                <input
                  type="checkbox"
                  checked={layers[item.key]}
                  onChange={() => toggle(item.key)}
                  className="h-4 w-4 accent-primary"
                />
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-xs">{item.label}</span>
              </label>
            ))}
          </div>

          {/* Equity gap analysis */}
          <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
            <div className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Equity Gap Analysis
            </div>
            <div className="mb-3 rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-card p-3 text-xs leading-relaxed dark:border-red-900/30 dark:from-red-950/30">
              <strong className="text-red-600 dark:text-red-400">{worstTracts.length} of {gapResults.length}</strong> LILA
              tracts have critically poor transit access (score &lt;30).{" "}
              <strong className="text-red-600 dark:text-red-400">{noAccessTracts.length}</strong> have no direct bus to
              grocery. Avg score: <strong className="text-red-600 dark:text-red-400">{avgScore}/100</strong>.
            </div>
            <div className="flex max-h-[350px] flex-col gap-2 overflow-y-auto">
              {gapResults.map((g) => {
                const sev = equitySeverity(g.score);
                const scoreClass =
                  g.score < 30
                    ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                    : g.score < 60
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300";
                const borderClass =
                  sev === "high"
                    ? "border-l-red-500"
                    : sev === "medium"
                      ? "border-l-amber-500"
                      : "border-l-emerald-500";

                return (
                  <div
                    key={g.tract_id}
                    className={cn(
                      "cursor-pointer rounded-lg border-l-[3px] bg-muted p-2.5 transition-colors hover:bg-muted/80",
                      borderClass,
                    )}
                  >
                    <div className="text-xs font-semibold">{g.name}</div>
                    <div className="mt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">
                      Pop: {g.pop?.toLocaleString()} | Poverty: {g.poverty_rate}% | No car: {g.pct_no_vehicle}%
                      <br />
                      Stops within 0.5mi: {g.stopsNearby} | Grocery: {g.nearestGroceryDist.toFixed(1)}mi
                      <br />
                      {g.groceryAccessible ? (
                        `Bus to grocery: ~${Math.round(g.transitTimeEstimate!)} min`
                      ) : (
                        <span className="text-red-600 dark:text-red-400">No direct bus route to grocery</span>
                      )}
                    </div>
                    <span className={cn("mt-1 inline-block rounded px-1.5 py-0.5 text-[0.6rem] font-bold", scoreClass)}>
                      Equity Score: {g.score}/100
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
