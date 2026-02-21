import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { Source, Layer } from "react-map-gl/mapbox";
import { MapProvider } from "@/components/map/MapProvider";
import { KpiCard } from "@/components/KpiCard";
import { generateVacancyData } from "@/lib/vacancy-data";
import { scoreColor, scoreLabel } from "@/lib/colors";
import { cn } from "@/lib/utils";
import type { VacantProperty } from "@/lib/types";

export const Route = createFileRoute("/vacancy")({ component: VacancyPage });

function VacancyPage() {
  const allProperties = useMemo(() => generateVacancyData(), []);
  const [useFilter, setUseFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [hoodFilter, setHoodFilter] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const [selected, setSelected] = useState<VacantProperty | null>(null);

  const neighborhoods = useMemo(
    () => [...new Set(allProperties.map((p) => p.neighborhood))].sort(),
    [allProperties],
  );

  const filtered = useMemo(() => {
    return allProperties.filter((p) => {
      if (p.triageScore < minScore) return false;
      if (useFilter !== "all" && p.bestUse !== useFilter) return false;
      if (ownerFilter === "lra" && p.owner !== "LRA") return false;
      if (ownerFilter === "private" && p.owner !== "PRIVATE") return false;
      if (ownerFilter === "city" && p.owner !== "CITY") return false;
      if (typeFilter === "lot" && p.propertyType !== "lot") return false;
      if (typeFilter === "building" && p.propertyType !== "building") return false;
      if (hoodFilter !== "all" && p.neighborhood !== hoodFilter) return false;
      return true;
    });
  }, [allProperties, useFilter, ownerFilter, typeFilter, hoodFilter, minScore]);

  // GeoJSON for markers
  const markersGeo = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: filtered.map((p) => ({
        type: "Feature" as const,
        properties: {
          id: p.id,
          score: p.triageScore,
          type: p.propertyType,
          address: p.address,
          bestUse: p.bestUse,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [p.lng, p.lat],
        },
      })),
    }),
    [filtered],
  );

  const avgScore = filtered.length
    ? Math.round(filtered.reduce((s, p) => s + p.triageScore, 0) / filtered.length)
    : 0;
  const lraCount = filtered.filter((p) => p.owner === "LRA").length;
  const topCount = filtered.filter((p) => p.triageScore >= 80).length;

  const handleMapClick = useCallback(
    (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (e.features?.length) {
        const id = e.features[0].properties?.id;
        const prop = filtered.find((p) => p.id === id);
        if (prop) setSelected(prop);
      }
    },
    [filtered],
  );

  const useLabels: Record<string, string> = {
    housing: "Affordable Housing",
    solar: "Solar Installation",
    garden: "Community Garden",
  };
  const conditionLabels: Record<number, string> = {
    1: "Condemned", 2: "Poor", 3: "Fair", 4: "Good", 5: "Excellent",
  };
  const ownerLabels: Record<string, string> = {
    LRA: "Land Reutilization Authority",
    CITY: "City of St. Louis",
    PRIVATE: "Private Owner",
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-primary">Vacancy</span> Triage Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Prioritizing vacant properties for rehabilitation in St. Louis
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Showing Properties" value={filtered.length} color="accent" />
        <KpiCard label="Avg Triage Score" value={avgScore} color="warning" />
        <KpiCard label="LRA Owned" value={lraCount} color="info" />
        <KpiCard label="High Priority (80+)" value={topCount} color="success" />
      </div>

      {/* Filters */}
      <div className="card-elevated flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
        <span className="text-xs font-semibold text-muted-foreground">Filters:</span>
        <select value={useFilter} onChange={(e) => setUseFilter(e.target.value)} className="rounded-lg border border-border bg-muted px-2 py-1.5 text-xs text-foreground">
          <option value="all">All Best Uses</option>
          <option value="housing">Housing</option>
          <option value="solar">Solar</option>
          <option value="garden">Garden</option>
        </select>
        <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="rounded-lg border border-border bg-muted px-2 py-1.5 text-xs text-foreground">
          <option value="all">All Owners</option>
          <option value="lra">LRA</option>
          <option value="city">City</option>
          <option value="private">Private</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-border bg-muted px-2 py-1.5 text-xs text-foreground">
          <option value="all">All Types</option>
          <option value="building">Buildings</option>
          <option value="lot">Lots</option>
        </select>
        <select value={hoodFilter} onChange={(e) => setHoodFilter(e.target.value)} className="rounded-lg border border-border bg-muted px-2 py-1.5 text-xs text-foreground">
          <option value="all">All Neighborhoods</option>
          {neighborhoods.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Min Score: {minScore}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(+e.target.value)}
            className="w-24 accent-primary"
          />
        </div>
      </div>

      {/* Map + Detail Panel */}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <MapProvider
            className="h-[600px] w-full rounded-lg"
            zoom={13}
            center={{ longitude: -90.235, latitude: 38.635 }}
            onMapLoad={(map) => {
              map.on("click", "vacancy-circles", (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
                handleMapClick(e);
              });
              map.on("mouseenter", "vacancy-circles", () => {
                map.getCanvas().style.cursor = "pointer";
              });
              map.on("mouseleave", "vacancy-circles", () => {
                map.getCanvas().style.cursor = "";
              });
            }}
          >
            <Source id="vacancies" type="geojson" data={markersGeo}>
              <Layer
                id="vacancy-circles"
                type="circle"
                paint={{
                  "circle-radius": [
                    "case",
                    ["==", ["get", "type"], "building"], 6,
                    4,
                  ],
                  "circle-color": [
                    "step", ["get", "score"],
                    "#d7191c",
                    20, "#fdae61",
                    40, "#ffffbf",
                    60, "#a6d96a",
                    80, "#1a9641",
                  ],
                  "circle-opacity": 0.85,
                  "circle-stroke-color": "#ffffff",
                  "circle-stroke-width": 0.5,
                  "circle-stroke-opacity": 0.6,
                }}
              />
            </Source>
          </MapProvider>
        </div>

        {/* Detail panel */}
        <div className="card-elevated rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Property Detail
          </div>
          {selected ? (
            <div className="flex flex-col gap-2 text-xs">
              <div className="text-base font-bold">{selected.address}</div>
              <DetailRow label="Neighborhood" value={selected.neighborhood} />
              <DetailRow label="Parcel ID" value={selected.parcelId} />
              <DetailRow label="Type" value={selected.propertyType === "building" ? "Vacant Building" : "Vacant Lot"} />
              <DetailRow label="Condition" value={conditionLabels[selected.conditionRating] || String(selected.conditionRating)} />
              {selected.propertyType === "building" && (
                <>
                  <DetailRow label="Year Built" value={String(selected.yearBuilt)} />
                  <DetailRow label="Stories" value={String(selected.stories)} />
                  <DetailRow label="Board-Up" value={selected.boardUpStatus} />
                </>
              )}
              <DetailRow label="Lot Size" value={`${selected.lotSqFt.toLocaleString()} sq ft`} />
              <DetailRow label="Zoning" value={selected.zoning} />
              <DetailRow label="Owner" value={ownerLabels[selected.owner]} />
              <DetailRow label="Tax Delinquent" value={`${selected.taxYearsDelinquent} yr${selected.taxYearsDelinquent !== 1 ? "s" : ""}`} />
              <DetailRow label="Violations" value={String(selected.violationCount)} />
              <DetailRow label="311 Complaints" value={`${selected.complaintsNearby} nearby`} />
              <DetailRow label="Assessed Value" value={`$${selected.assessedValue.toLocaleString()}`} />

              <div className="flex items-center justify-between border-b border-border py-1">
                <span className="text-muted-foreground">Triage Score</span>
                <span className="text-sm font-bold" style={{ color: scoreColor(selected.triageScore) }}>
                  {selected.triageScore}/100
                </span>
              </div>

              <span
                className={cn(
                  "inline-block self-start rounded-full px-3 py-1 text-xs font-bold",
                  selected.bestUse === "housing" && "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
                  selected.bestUse === "solar" && "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
                  selected.bestUse === "garden" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
                )}
              >
                {useLabels[selected.bestUse]}
              </span>

              {/* Score breakdown */}
              <div className="mt-2 rounded-lg bg-muted p-3">
                <div className="mb-2 text-xs font-semibold">Score Breakdown</div>
                {Object.entries(selected.scoreBreakdown).map(([key, val]) => (
                  <div key={key} className="mb-1">
                    <div className="flex justify-between text-[0.7rem]">
                      <span className="capitalize text-muted-foreground">{key}</span>
                      <span className="font-medium">{val}</span>
                    </div>
                    <div className="mt-0.5 h-1.5 rounded-full bg-background">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent complaints */}
              {selected.recentComplaints.length > 0 && (
                <div className="mt-1 rounded-lg bg-muted p-3">
                  <div className="mb-1 text-xs font-semibold">Recent 311 Complaints</div>
                  {selected.recentComplaints.map((c, i) => (
                    <div key={i} className="border-b border-border/50 py-1 text-[0.7rem]">
                      <span className="text-muted-foreground">{c.date}</span> — {c.category}{" "}
                      <span className={c.status === "Open" ? "font-semibold text-red-600 dark:text-red-400" : "font-semibold text-emerald-600 dark:text-emerald-400"}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
              Click a property on the map to view details
            </div>
          )}
        </div>
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
