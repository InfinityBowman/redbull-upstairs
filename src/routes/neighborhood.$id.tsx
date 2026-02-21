import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { KpiCard } from "@/components/KpiCard";
import { generateVacancyData } from "@/lib/vacancy-data";
import { haversine, polygonCentroid } from "@/lib/equity";
import { CATEGORY_COLORS, scoreColor } from "@/lib/colors";
import { cn } from "@/lib/utils";
import type {
  CSBData,
  TrendsData,
  GeoJSONCollection,
  NeighborhoodProperties,
  FoodDesertProperties,
  StopStats,
  TransitRoute,
  VacantProperty,
} from "@/lib/types";

export const Route = createFileRoute("/neighborhood/$id")({
  component: NeighborhoodReportCard,
});

function NeighborhoodReportCard() {
  const { id } = Route.useParams();
  const hoodKey = id.padStart(2, "0");

  const [csbData, setCsbData] = useState<CSBData | null>(null);
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [geoData, setGeoData] = useState<GeoJSONCollection<NeighborhoodProperties> | null>(null);
  const [foodDeserts, setFoodDeserts] = useState<GeoJSONCollection<FoodDesertProperties> | null>(null);
  const [stopsData, setStopsData] = useState<GeoJSONCollection | null>(null);
  const [stopStats, setStopStats] = useState<Record<string, StopStats> | null>(null);
  const [routesData, setRoutesData] = useState<TransitRoute[] | null>(null);
  const [groceryData, setGroceryData] = useState<GeoJSONCollection<{ name: string; chain: string }> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/csb_latest.json").then((r) => r.json()),
      fetch("/data/trends.json").then((r) => r.json()),
      fetch("/data/neighborhoods.geojson").then((r) => r.json()),
      fetch("/data/food_deserts.geojson").then((r) => r.json()),
      fetch("/data/stops.geojson").then((r) => r.json()),
      fetch("/data/stop_stats.json").then((r) => r.json()),
      fetch("/data/routes.json").then((r) => r.json()),
      fetch("/data/grocery_stores.geojson").then((r) => r.json()),
    ]).then(([csb, trends, geo, fd, stops, stats, routes, grocery]) => {
      setCsbData(csb);
      setTrendsData(trends);
      setGeoData(geo);
      setFoodDeserts(fd);
      setStopsData(stops);
      setStopStats(stats);
      setRoutesData(routes);
      setGroceryData(grocery);
    });
  }, []);

  if (!csbData || !trendsData || !geoData || !foodDeserts || !stopsData || !stopStats || !routesData || !groceryData) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
        <span className="ml-3">Loading neighborhood data...</span>
      </div>
    );
  }

  const hood = csbData.neighborhoods[hoodKey];
  if (!hood) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="text-lg font-bold text-muted-foreground">Neighborhood not found</div>
        <Link to="/" className="text-sm text-primary hover:underline">&larr; Back to Overview</Link>
      </div>
    );
  }

  return (
    <ReportCardView
      hoodKey={hoodKey}
      hood={hood}
      csbData={csbData}
      trendsData={trendsData}
      geoData={geoData}
      foodDeserts={foodDeserts}
      stopsData={stopsData}
      stopStats={stopStats}
      routesData={routesData}
      groceryData={groceryData}
    />
  );
}

function ReportCardView({
  hoodKey,
  hood,
  csbData,
  trendsData,
  geoData,
  foodDeserts,
  stopsData,
  stopStats,
  routesData,
  groceryData,
}: {
  hoodKey: string;
  hood: CSBData["neighborhoods"][string];
  csbData: CSBData;
  trendsData: TrendsData;
  geoData: GeoJSONCollection<NeighborhoodProperties>;
  foodDeserts: GeoJSONCollection<FoodDesertProperties>;
  stopsData: GeoJSONCollection;
  stopStats: Record<string, StopStats>;
  routesData: TransitRoute[];
  groceryData: GeoJSONCollection<{ name: string; chain: string }>;
}) {
  // Vacancy data for this neighborhood
  const allVacancies = useMemo(() => generateVacancyData(), []);
  const hoodVacancies = useMemo(
    () => allVacancies.filter((p) => p.neighborhood === hood.name),
    [allVacancies, hood.name],
  );

  // Get neighborhood polygon centroid
  const hoodFeature = geoData.features.find((f) => String(f.properties.NHD_NUM).padStart(2, "0") === hoodKey);
  const centroid: [number, number] = hoodFeature
    ? polygonCentroid(hoodFeature.geometry.coordinates as number[][][])
    : [38.635, -90.245];

  // Transit: find stops within 0.5mi of centroid
  const nearbyStops = useMemo(() => {
    return stopsData.features.filter((stop) => {
      const [lon, lat] = stop.geometry.coordinates as number[];
      return haversine(centroid[0], centroid[1], lat, lon) <= 0.5;
    });
  }, [stopsData, centroid]);

  const nearbyRoutes = useMemo(() => {
    const routeIds = new Set<string>();
    nearbyStops.forEach((stop) => {
      const stats = stopStats[stop.properties.stop_id as string];
      if (stats) stats.routes.forEach((r) => routeIds.add(r));
    });
    return routesData.filter((r) => routeIds.has(r.route_id));
  }, [nearbyStops, stopStats, routesData]);

  const totalFrequency = nearbyStops.reduce((s, stop) => {
    const stats = stopStats[stop.properties.stop_id as string];
    return s + (stats?.trip_count || 0);
  }, 0);

  // Food access: check nearby tracts
  const nearestGrocery = useMemo(() => {
    let nearest = { name: "N/A", dist: Infinity };
    groceryData.features.forEach((store) => {
      const [lon, lat] = store.geometry.coordinates as number[];
      const dist = haversine(centroid[0], centroid[1], lat, lon);
      if (dist < nearest.dist) {
        nearest = { name: store.properties.name, dist };
      }
    });
    return nearest;
  }, [groceryData, centroid]);

  const isDesert = useMemo(() => {
    return foodDeserts.features.some((f) => {
      const p = f.properties as FoodDesertProperties;
      if (!p.lila) return false;
      const tc = polygonCentroid(f.geometry.coordinates as number[][][]);
      return haversine(centroid[0], centroid[1], tc[0], tc[1]) < 0.5;
    });
  }, [foodDeserts, centroid]);

  // Category breakdown chart
  const catData = useMemo(
    () =>
      Object.entries(hood.topCategories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value })),
    [hood],
  );

  // Monthly trend for this hood
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    // We don't have per-neighborhood monthly, so use city-wide scaled by ratio
    const yearData = trendsData.yearlyMonthly["2024"] || {};
    const cityTotal = Object.values(yearData).reduce((a, b) => a + b, 0) || 1;
    const ratio = hood.total / cityTotal;
    return months.map((month, i) => {
      const key = `2024-${String(i + 1).padStart(2, "0")}`;
      return { month, value: Math.round((yearData[key] || 0) * ratio) };
    });
  }, [trendsData, hood]);

  // Composite equity score
  const avgVacancyScore = hoodVacancies.length
    ? Math.round(hoodVacancies.reduce((s, p) => s + p.triageScore, 0) / hoodVacancies.length)
    : 0;

  const transitScore = Math.min(100, nearbyStops.length * 15 + Math.min(totalFrequency * 0.3, 30));
  const complaintScore = Math.max(0, 100 - (hood.total / 50));
  const foodScore = nearestGrocery.dist <= 0.5 ? 90 : nearestGrocery.dist <= 1 ? 60 : nearestGrocery.dist <= 2 ? 30 : 10;
  const compositeScore = Math.round((transitScore + complaintScore + foodScore + (100 - avgVacancyScore)) / 4);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">&larr; Overview</Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-bold">{hood.name}</h1>
        <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
          Neighborhood #{hoodKey}
        </span>
      </div>

      {/* Composite score + KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="rounded-xl border-2 border-primary/30 bg-card p-4 text-center">
          <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Composite Score</div>
          <div className="mt-1 text-3xl font-extrabold text-primary">{compositeScore}</div>
          <div className="text-xs text-muted-foreground">/100</div>
        </div>
        <KpiCard label="311 Complaints" value={hood.total.toLocaleString()} sub={`${hood.closed} closed`} color="accent" />
        <KpiCard label="Vacant Properties" value={hoodVacancies.length} sub={`Avg score: ${avgVacancyScore}`} color="danger" />
        <KpiCard label="Transit Stops" value={nearbyStops.length} sub={`${nearbyRoutes.length} routes, ${totalFrequency} trips/day`} color="info" />
        <KpiCard label="Nearest Grocery" value={`${nearestGrocery.dist.toFixed(1)}mi`} sub={nearestGrocery.name} color={isDesert ? "warning" : "success"} />
      </div>

      {/* Score breakdown bars */}
      <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
        <div className="mb-3 text-sm font-bold">Score Breakdown</div>
        <div className="grid gap-3 md:grid-cols-4">
          <ScoreBar label="Transit Access" score={Math.round(transitScore)} />
          <ScoreBar label="311 Health" score={Math.round(complaintScore)} />
          <ScoreBar label="Food Access" score={foodScore} />
          <ScoreBar label="Vacancy (inverse)" score={100 - avgVacancyScore} />
        </div>
      </div>

      {/* Detail panels */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 311 Panel */}
        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">311 Complaints</div>
          <div className="mb-3 text-xs text-muted-foreground">
            Avg resolution: <strong>{hood.avgResolutionDays}d</strong>
          </div>
          <div className="mb-3 text-xs font-semibold">Top Issues</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={10} />
              <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" fontSize={10} width={120} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 11, color: "var(--color-foreground)" }} />
              <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                {catData.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length] + "99"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vacancy Panel */}
        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">Vacancy Triage</div>
          <div className="mb-3 text-xs text-muted-foreground">
            {hoodVacancies.length} properties | {hoodVacancies.filter((p) => p.owner === "LRA").length} LRA
          </div>
          {hoodVacancies.length > 0 ? (
            <>
              <div className="mb-2 text-xs font-semibold">Best Rehab Candidates</div>
              <div className="flex flex-col gap-1.5">
                {[...hoodVacancies]
                  .sort((a, b) => b.triageScore - a.triageScore)
                  .slice(0, 5)
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded bg-muted px-2.5 py-1.5 text-[0.7rem]">
                      <div>
                        <span className="font-medium">{p.address}</span>
                        <span className="ml-1 text-muted-foreground">({p.propertyType})</span>
                      </div>
                      <span className="font-bold" style={{ color: scoreColor(p.triageScore) }}>
                        {p.triageScore}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="mt-3 text-xs font-semibold">By Best Use</div>
              <div className="mt-1 flex gap-3 text-xs">
                <span className="text-blue-600 dark:text-blue-400">{hoodVacancies.filter((p) => p.bestUse === "housing").length} Housing</span>
                <span className="text-amber-600 dark:text-amber-400">{hoodVacancies.filter((p) => p.bestUse === "solar").length} Solar</span>
                <span className="text-emerald-600 dark:text-emerald-400">{hoodVacancies.filter((p) => p.bestUse === "garden").length} Garden</span>
              </div>
            </>
          ) : (
            <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">No vacancies</div>
          )}
        </div>

        {/* Transit + Food Panel */}
        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 text-sm font-bold text-purple-600 dark:text-purple-400">Transit & Food Access</div>
          <div className="mb-2 text-xs text-muted-foreground">
            {isDesert ? (
              <span className="font-semibold text-red-600 dark:text-red-400">In a food desert area</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400">Not in a food desert</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5 text-xs">
            <DetailRow label="Stops (0.5mi)" value={String(nearbyStops.length)} />
            <DetailRow label="Routes" value={nearbyRoutes.map((r) => r.route_short_name || r.route_long_name).join(", ") || "None"} />
            <DetailRow label="Trips/day" value={String(totalFrequency)} />
            <DetailRow label="Nearest Grocery" value={`${nearestGrocery.name} (${nearestGrocery.dist.toFixed(2)}mi)`} />
          </div>

          {/* Monthly trend mini chart */}
          <div className="mt-4 text-xs font-semibold">Estimated Monthly Trend</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={9} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={9} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 11, color: "var(--color-foreground)" }} />
              <Bar dataKey="value" fill="#6366f199" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{score}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/50 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
