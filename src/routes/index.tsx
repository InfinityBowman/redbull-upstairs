import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Source, Layer } from "react-map-gl/mapbox";
import { MapProvider } from "@/components/map/MapProvider";
import { MapLegend } from "@/components/map/MapLegend";
import { KpiCard } from "@/components/KpiCard";
import { computeKPIs, detectVolumeHotspots } from "@/lib/analysis";
import { generateVacancyData } from "@/lib/vacancy-data";
import { CHORO_COLORS, dynamicBreaks } from "@/lib/colors";
import { cn } from "@/lib/utils";
import type { CSBData, GeoJSONCollection, NeighborhoodProperties, FoodDesertProperties, TransitRoute } from "@/lib/types";

export const Route = createFileRoute("/")({ component: OverviewDashboard });

function OverviewDashboard() {
  const [csbData, setCsbData] = useState<CSBData | null>(null);
  const [geoData, setGeoData] = useState<GeoJSONCollection<NeighborhoodProperties> | null>(null);
  const [foodDeserts, setFoodDeserts] = useState<GeoJSONCollection<FoodDesertProperties> | null>(null);
  const [routesData, setRoutesData] = useState<TransitRoute[] | null>(null);
  const [stopsData, setStopsData] = useState<GeoJSONCollection | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/csb_latest.json").then((r) => r.json()),
      fetch("/data/neighborhoods.geojson").then((r) => r.json()),
      fetch("/data/food_deserts.geojson").then((r) => r.json()),
      fetch("/data/routes.json").then((r) => r.json()),
      fetch("/data/stops.geojson").then((r) => r.json()),
    ]).then(([csb, geo, fd, routes, stops]) => {
      setCsbData(csb);
      setGeoData(geo);
      setFoodDeserts(fd);
      setRoutesData(routes);
      setStopsData(stops);
    });
  }, []);

  if (!csbData || !geoData || !foodDeserts || !routesData || !stopsData) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
        <span className="ml-3">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <DashboardView
      csbData={csbData}
      geoData={geoData}
      foodDeserts={foodDeserts}
      routesData={routesData}
      stopsData={stopsData}
    />
  );
}

function DashboardView({
  csbData,
  geoData,
  foodDeserts,
  routesData,
  stopsData,
}: {
  csbData: CSBData;
  geoData: GeoJSONCollection<NeighborhoodProperties>;
  foodDeserts: GeoJSONCollection<FoodDesertProperties>;
  routesData: TransitRoute[];
  stopsData: GeoJSONCollection;
}) {
  const kpis = useMemo(() => computeKPIs(csbData), [csbData]);
  const vacancyData = useMemo(() => generateVacancyData(), []);
  const hotspots = useMemo(() => detectVolumeHotspots(csbData), [csbData]);

  const desertTracts = foodDeserts.features.filter((f) => (f.properties as FoodDesertProperties).lila);
  const desertPop = desertTracts.reduce((s, f) => s + ((f.properties as FoodDesertProperties).pop || 0), 0);

  // Compute composite "health" per neighborhood based on 311 data
  const choroplethGeo = useMemo(() => {
    const features = geoData.features.map((f) => {
      const key = String(f.properties.NHD_NUM).padStart(2, "0");
      const hood = csbData.neighborhoods[key];
      return {
        ...f,
        properties: {
          ...f.properties,
          complaintCount: hood?.total || 0,
        },
      };
    });
    return { type: "FeatureCollection" as const, features };
  }, [geoData, csbData]);

  const allCounts = choroplethGeo.features.map((f) => f.properties.complaintCount).filter((c) => c > 0);
  const breaks = dynamicBreaks(allCounts);

  const fillColorExpr: mapboxgl.Expression = [
    "step",
    ["get", "complaintCount"],
    CHORO_COLORS[0],
    ...breaks.slice(1).flatMap((b, i) => [b, CHORO_COLORS[i + 1]]),
  ];

  // Transit coverage: rough approximation
  const transitCoverage = Math.round((stopsData.features.length / 800) * 100);

  const toolLinks = [
    { to: "/complaints", title: "311 Pattern Detector", desc: "Analyze complaint hotspots, resolution times, and category breakdowns", color: "text-indigo-600 dark:text-indigo-400" },
    { to: "/transit", title: "Transit Equity Mapper", desc: "Explore transit access gaps in food desert communities", color: "text-purple-600 dark:text-purple-400" },
    { to: "/vacancy", title: "Vacancy Triage", desc: "Prioritize vacant properties for rehabilitation by triage score", color: "text-emerald-600 dark:text-emerald-400" },
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-primary">STL</span> Urban Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cross-dataset insights for the City of St. Louis — 311 Complaints, Transit Equity, Vacancy Triage
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="311 Complaints (2024)" value={kpis.totalRequests.toLocaleString()} sub={`${kpis.perDay}/day avg`} color="accent" />
        <KpiCard label="Vacant Properties" value={vacancyData.length} sub={`${vacancyData.filter((p) => p.triageScore >= 80).length} high priority`} color="danger" />
        <KpiCard label="Transit Coverage" value={`${transitCoverage}%`} sub={`${stopsData.features.length} stops, ${routesData.length} routes`} color="info" />
        <KpiCard label="Food Desert Pop." value={desertPop.toLocaleString()} sub={`${desertTracts.length} LILA tracts`} color="warning" />
      </div>

      {/* Map + Hotspots + Links */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 text-sm font-bold">Neighborhood Complaint Density</div>
          <div className="relative">
            <MapProvider className="h-[450px] w-full rounded-lg">
              <Source id="overview-choropleth" type="geojson" data={choroplethGeo}>
                <Layer
                  id="overview-fill"
                  type="fill"
                  paint={{
                    "fill-color": fillColorExpr,
                    "fill-opacity": 0.75,
                  }}
                />
                <Layer
                  id="overview-outline"
                  type="line"
                  paint={{
                    "line-color": "rgba(0,0,0,0.15)",
                    "line-width": 1,
                  }}
                />
              </Source>
            </MapProvider>
            <MapLegend title="311 Complaints" gradient />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Top hotspots */}
          <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
            <div className="mb-2 text-sm font-bold">Top 5 Hotspot Neighborhoods</div>
            <div className="flex flex-col gap-2">
              {hotspots.slice(0, 5).map((h, i) => (
                <div key={h.name} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-[0.6rem] font-bold text-red-600 dark:text-red-400">
                      {i + 1}
                    </span>
                    <span className="text-xs font-medium">{h.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold">{h.total.toLocaleString()}</span>
                    <span className="ml-1 text-[0.65rem] text-red-600 dark:text-red-400">{h.ratio}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
            <div className="mb-2 text-sm font-bold">Explore Tools</div>
            <div className="flex flex-col gap-2">
              {toolLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group rounded-lg border border-transparent bg-muted p-3 transition-all hover:border-border hover:bg-accent hover:shadow-sm"
                >
                  <div className={cn("text-xs font-semibold transition-transform group-hover:translate-x-0.5", link.color)}>
                    {link.title} &rarr;
                  </div>
                  <div className="mt-0.5 text-[0.7rem] text-muted-foreground">
                    {link.desc}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
