import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Source, Layer, type MapMouseEvent } from "react-map-gl/mapbox";
import { MapProvider } from "@/components/map/MapProvider";
import { MapLegend } from "@/components/map/MapLegend";
import { KpiCard } from "@/components/KpiCard";
import { HotspotList } from "@/components/HotspotList";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { CategoryBarChart } from "@/components/charts/CategoryBarChart";
import { HourlyChart } from "@/components/charts/HourlyChart";
import { YoYChart } from "@/components/charts/YoYChart";
import {
  computeKPIs,
  detectVolumeHotspots,
  detectSlowHotspots,
  weatherInsights,
  movingAverage,
  getHoodComplaintCount,
} from "@/lib/analysis";
import { CHORO_COLORS, dynamicBreaks, CATEGORY_COLORS } from "@/lib/colors";
import { cn } from "@/lib/utils";
import type { CSBData, TrendsData, GeoJSONCollection, NeighborhoodProperties, MapMode } from "@/lib/types";

export const Route = createFileRoute("/complaints")({ component: ComplaintsPage });

function ComplaintsPage() {
  const [csbData, setCsbData] = useState<CSBData | null>(null);
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [geoData, setGeoData] = useState<GeoJSONCollection<NeighborhoodProperties> | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>("choropleth");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    Promise.all([
      fetch("/data/csb_latest.json").then((r) => r.json()),
      fetch("/data/trends.json").then((r) => r.json()),
      fetch("/data/neighborhoods.geojson").then((r) => r.json()),
    ]).then(([csb, trends, geo]) => {
      setCsbData(csb);
      setTrendsData(trends);
      setGeoData(geo);
    });
  }, []);

  if (!csbData || !trendsData || !geoData) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
        <span className="ml-3">Loading 311 data...</span>
      </div>
    );
  }

  return (
    <ComplaintsView
      csbData={csbData}
      trendsData={trendsData}
      geoData={geoData}
      mapMode={mapMode}
      setMapMode={setMapMode}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
    />
  );
}

function ComplaintsView({
  csbData,
  trendsData,
  geoData,
  mapMode,
  setMapMode,
  activeCategory,
  setActiveCategory,
}: {
  csbData: CSBData;
  trendsData: TrendsData;
  geoData: GeoJSONCollection<NeighborhoodProperties>;
  mapMode: MapMode;
  setMapMode: (m: MapMode) => void;
  activeCategory: string;
  setActiveCategory: (c: string) => void;
}) {
  const kpis = useMemo(() => computeKPIs(csbData), [csbData]);
  const volumeHotspots = useMemo(() => detectVolumeHotspots(csbData), [csbData]);
  const slowHotspots = useMemo(() => detectSlowHotspots(csbData), [csbData]);
  const weather = useMemo(
    () => weatherInsights(csbData.dailyCounts, trendsData.weather2024),
    [csbData, trendsData],
  );

  const topCategories = useMemo(
    () =>
      Object.entries(csbData.categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([cat]) => cat),
    [csbData],
  );

  // Build choropleth GeoJSON with complaint counts baked in
  const choroplethGeo = useMemo(() => {
    const features = geoData.features.map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        complaintCount: getHoodComplaintCount(csbData, f.properties.NHD_NUM, activeCategory),
      },
    }));
    return { type: "FeatureCollection" as const, features };
  }, [geoData, csbData, activeCategory]);

  const allCounts = choroplethGeo.features.map((f) => f.properties.complaintCount).filter((c) => c > 0);
  const breaks = dynamicBreaks(allCounts);

  // Build heatmap GeoJSON from heatmapPoints
  const heatmapGeo = useMemo(() => {
    let points = csbData.heatmapPoints;
    if (activeCategory !== "all") {
      points = points.filter((p) => p[2] === activeCategory);
    }
    return {
      type: "FeatureCollection" as const,
      features: points.map((p) => ({
        type: "Feature" as const,
        properties: { weight: 0.6 },
        geometry: { type: "Point" as const, coordinates: [p[1], p[0]] },
      })),
    };
  }, [csbData, activeCategory]);

  // Daily chart data
  const dailyChart = useMemo(() => {
    const entries = Object.entries(csbData.dailyCounts).sort();
    const values = entries.map((e) => e[1]);
    const ma7 = movingAverage(values);
    return entries.map((e, i) => ({ date: e[0], value: e[1], ma7: ma7[i] }));
  }, [csbData]);

  // Category chart data
  const categoryChart = useMemo(
    () =>
      Object.entries(csbData.categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([name, value]) => ({ name, value })),
    [csbData],
  );

  // Neighborhood table data
  const [hoodSort, setHoodSort] = useState("total-desc");
  const hoodData = useMemo(() => {
    const hoods = Object.entries(csbData.neighborhoods)
      .map(([id, h]) => ({ id, ...h }))
      .filter((h) => h.name && !h.name.startsWith("Area"));

    switch (hoodSort) {
      case "total-asc": return [...hoods].sort((a, b) => a.total - b.total);
      case "resolution-desc": return [...hoods].sort((a, b) => b.avgResolutionDays - a.avgResolutionDays);
      case "resolution-asc": return [...hoods].sort((a, b) => a.avgResolutionDays - b.avgResolutionDays);
      case "name-asc": return [...hoods].sort((a, b) => a.name.localeCompare(b.name));
      default: return [...hoods].sort((a, b) => b.total - a.total);
    }
  }, [csbData, hoodSort]);

  const maxTotal = useMemo(() => Math.max(...hoodData.map((h) => h.total)), [hoodData]);

  // Legend items
  const legendItems = breaks.map((b, i) => {
    const next = breaks[i + 1];
    const label =
      i === breaks.length - 1 ? `${b.toLocaleString()}+` : `${b.toLocaleString()}–${((next || b) - 1).toLocaleString()}`;
    return { color: CHORO_COLORS[i], label };
  });

  // Build fill-color expression for choropleth
  const fillColorExpr: mapboxgl.Expression = [
    "step",
    ["get", "complaintCount"],
    CHORO_COLORS[0],
    ...breaks.slice(1).flatMap((b, i) => [b, CHORO_COLORS[i + 1]]),
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-primary">311</span> Pattern Detector
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analyzing Citizens Service Bureau complaint patterns in St. Louis
          </p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {csbData.totalRequests.toLocaleString()} requests
          </span>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            2024 data
          </span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total Requests (2024)" value={kpis.totalRequests.toLocaleString()} sub={`${kpis.perDay} per day average`} color="accent" />
        <KpiCard label="Closure Rate" value={`${kpis.closedPct}%`} sub={`${kpis.closedCount.toLocaleString()} closed`} color="success" />
        <KpiCard label="Avg Resolution Time" value={`${kpis.avgResolution}d`} sub="Across all neighborhoods" color="warning" />
        <KpiCard label="Slowest Neighborhood" value={`${kpis.slowest.avgResolutionDays}d`} sub={`${kpis.slowest.name} (${kpis.slowest.total} req)`} color="danger" />
        <KpiCard label="Peak Day" value={kpis.peakDay.count} sub={kpis.peakDay.date} color="info" />
      </div>

      {/* Map + Hotspots */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 text-sm font-bold">Complaint Map</div>
          {/* Controls */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">View:</span>
            {(["choropleth", "heatmap"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setMapMode(mode)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  mapMode === mode
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {mode === "choropleth" ? "Neighborhoods" : "Heatmap"}
              </button>
            ))}
            <div className="mx-1 h-5 w-px bg-border" />
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Filter:</span>
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                activeCategory === "all"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted text-muted-foreground hover:bg-accent",
              )}
            >
              All
            </button>
            {topCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  activeCategory === cat
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative">
            <MapProvider className="h-[550px] w-full rounded-lg">
              {mapMode === "choropleth" && (
                <Source id="neighborhoods" type="geojson" data={choroplethGeo}>
                  <Layer
                    id="choropleth-fill"
                    type="fill"
                    paint={{
                      "fill-color": fillColorExpr,
                      "fill-opacity": 0.75,
                    }}
                  />
                  <Layer
                    id="choropleth-outline"
                    type="line"
                    paint={{
                      "line-color": "rgba(0,0,0,0.15)",
                      "line-width": 1,
                    }}
                  />
                </Source>
              )}
              {mapMode === "heatmap" && (
                <Source id="heatmap-source" type="geojson" data={heatmapGeo}>
                  <Layer
                    id="complaints-heatmap"
                    type="heatmap"
                    paint={{
                      "heatmap-radius": 8,
                      "heatmap-opacity": 0.8,
                      "heatmap-color": [
                        "interpolate", ["linear"], ["heatmap-density"],
                        0, "transparent",
                        0.15, "#1b3a5c",
                        0.35, "#1a6b6a",
                        0.5, "#2f9e4f",
                        0.65, "#85c531",
                        0.8, "#f5c542",
                        1, "#f94144",
                      ],
                    }}
                  />
                </Source>
              )}
            </MapProvider>

            {mapMode === "choropleth" ? (
              <MapLegend
                title={activeCategory === "all" ? "Complaints" : activeCategory}
                items={legendItems}
              />
            ) : (
              <MapLegend title="Complaint Density" gradient />
            )}
          </div>
        </div>

        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-3 text-sm font-bold">Detected Hot Spots</div>
          <div className="flex max-h-[580px] flex-col gap-4 overflow-y-auto">
            <HotspotList title="HIGH VOLUME" items={volumeHotspots} type="volume" />
            <HotspotList title="SLOW RESOLUTION" items={slowHotspots} type="slow" />
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 text-sm font-bold">Daily Complaint Volume (2024)</div>
          <TimeSeriesChart data={dailyChart} barLabel="Daily Complaints" lineLabel="7-Day Moving Avg" />
        </div>
        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 text-sm font-bold">Complaints by Category</div>
          <CategoryBarChart data={categoryChart} horizontal />
        </div>
      </div>

      {/* Neighborhood Table */}
      <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
        <div className="mb-3 flex items-center gap-4">
          <div className="text-sm font-bold">Neighborhood Analysis</div>
          <select
            value={hoodSort}
            onChange={(e) => setHoodSort(e.target.value)}
            className="rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs text-foreground"
          >
            <option value="total-desc">Most Complaints</option>
            <option value="total-asc">Fewest Complaints</option>
            <option value="resolution-desc">Slowest Resolution</option>
            <option value="resolution-asc">Fastest Resolution</option>
            <option value="name-asc">Name (A-Z)</option>
          </select>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="sticky top-0 bg-card text-left">
                <th className="border-b border-border px-2 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Neighborhood</th>
                <th className="border-b border-border px-2 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                <th className="border-b border-border px-2 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Volume</th>
                <th className="border-b border-border px-2 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Avg Resolution</th>
                <th className="border-b border-border px-2 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Top Issue</th>
              </tr>
            </thead>
            <tbody>
              {hoodData.map((h) => {
                const pct = Math.round((h.total / maxTotal) * 100);
                const topCat = Object.entries(h.topCategories).sort((a, b) => b[1] - a[1])[0];
                const resClass =
                  h.avgResolutionDays < 15
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                    : h.avgResolutionDays < 40
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                      : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";
                return (
                  <tr key={h.id} className="border-b border-border/50 hover:bg-primary/5">
                    <td className="px-2 py-1.5 font-medium">{h.name}</td>
                    <td className="px-2 py-1.5">{h.total.toLocaleString()}</td>
                    <td className="relative px-2 py-1.5">
                      <div
                        className="absolute inset-y-0.5 left-0 rounded bg-primary/15"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="relative">{pct}%</span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={cn("rounded px-1.5 py-0.5 text-[0.7rem] font-semibold", resClass)}>
                        {h.avgResolutionDays > 0 ? `${h.avgResolutionDays}d` : "N/A"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-muted-foreground">{topCat?.[0] || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom row: Hourly, Weekday, Weather */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 text-sm font-bold">Complaints by Hour of Day</div>
          <HourlyChart data={csbData.hourly} />
        </div>
        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 text-sm font-bold">Complaints by Day of Week</div>
          <WeekdayChart weekday={csbData.weekday} />
        </div>
        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 text-sm font-bold">Weather Correlation Insights</div>
          <WeatherInsights weather={weather} />
        </div>
      </div>

      {/* Year over year */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 text-sm font-bold">Monthly Volume: Year-over-Year</div>
          <YoYChart yearlyMonthly={trendsData.yearlyMonthly} />
        </div>
        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 text-sm font-bold">Weather vs Complaints (2024)</div>
          <WeatherVsComplaintsChart daily={csbData.dailyCounts} weather={trendsData.weather2024} />
        </div>
      </div>
    </div>
  );
}

// ── Inline sub-components ─────────────────────────────────

function WeekdayChart({ weekday }: { weekday: Record<string, number> }) {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const pythonOrder = [6, 0, 1, 2, 3, 4, 5];
  const data = dayNames.map((name, i) => ({
    name,
    value: weekday[String(pythonOrder[i])] || 0,
  }));

  return <CategoryBarChart data={data} horizontal={false} height={300} />;
}

function WeatherInsights({
  weather,
}: {
  weather: ReturnType<typeof weatherInsights>;
}) {
  const items = [
    {
      title: "Rain Day Effect",
      text: `Rainy days average ${weather.rain.avgRainy} complaints vs ${weather.rain.avgDry} on dry days (${weather.rain.diff > 0 ? "+" : ""}${weather.rain.diff}%).`,
    },
    {
      title: "Day-After Heavy Rain",
      text: `After heavy rain (>0.5 in), complaints average ${weather.afterRain.avgAfterHeavy} vs ${weather.afterRain.avgNormal} normally (${weather.afterRain.diff > 0 ? "+" : ""}${weather.afterRain.diff}%).`,
    },
    {
      title: "Temperature Effect",
      text: `Days above 90\u00b0F average ${weather.temp.avgHot} complaints vs ${weather.temp.avgCool} below 70\u00b0F (${weather.temp.diff > 0 ? "+" : ""}${weather.temp.diff}%).`,
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.title} className="rounded-lg bg-muted p-3">
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">{item.title}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{item.text}</div>
        </div>
      ))}
    </div>
  );
}

function WeatherVsComplaintsChart({
  daily,
  weather,
}: {
  daily: Record<string, number>;
  weather: TrendsData["weather2024"];
}) {
  const dates = Object.keys(daily).sort();
  const chartData: { date: string; complaints: number; precip: number }[] = [];

  for (let i = 0; i < dates.length; i += 7) {
    const chunk = dates.slice(i, i + 7);
    const complaints = chunk.reduce((s, d) => s + (daily[d] || 0), 0);
    const precip = chunk.reduce((s, d) => s + (weather[d]?.precip || 0), 0);
    chartData.push({
      date: chunk[0],
      complaints: Math.round(complaints / chunk.length),
      precip: Math.round(precip * 100) / 100,
    });
  }

  return (
    <div style={{ width: "100%", height: 300 }}>
      <WeatherComposedChart data={chartData} />
    </div>
  );
}

function WeatherComposedChart({
  data,
}: {
  data: { date: string; complaints: number; precip: number }[];
}) {
  return (
    <TimeSeriesChart
      data={data.map((d) => ({ date: d.date, value: d.complaints, ma7: null }))}
      barLabel="Avg Daily Complaints"
      lineLabel=""
      barColor="rgba(99,102,241,0.4)"
    />
  );
}
