// ── 311 Complaints ──────────────────────────────────────────

export interface NeighborhoodStats {
  name: string;
  total: number;
  closed: number;
  avgResolutionDays: number;
  topCategories: Record<string, number>;
}

export interface CSBData {
  year: number;
  totalRequests: number;
  categories: Record<string, number>;
  neighborhoods: Record<string, NeighborhoodStats>;
  dailyCounts: Record<string, number>;
  monthly: Record<string, number>;
  hourly: Record<string, number>;
  weekday: Record<string, number>;
  heatmapPoints: [number, number, string][]; // [lat, lng, category]
}

export interface TrendsData {
  yearlyMonthly: Record<string, Record<string, number>>;
  yearlyCategories: Record<string, Record<string, number>>;
  weather2024: Record<string, { high: number; low: number; precip: number }>;
}

// ── Transit ─────────────────────────────────────────────────

export interface TransitRoute {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number;
  route_color: string;
}

export interface StopStats {
  trip_count: number;
  routes: string[];
}

export interface GroceryStore {
  name: string;
  chain: string;
}

export interface FoodDesertProperties {
  tract_id: string;
  name: string;
  lila: boolean;
  pop: number;
  poverty_rate: number;
  median_income: number;
  pct_no_vehicle: number;
  nearest_grocery_miles?: number;
}

export interface EquityGapResult {
  tract_id: string;
  name: string;
  pop: number;
  poverty_rate: number;
  pct_no_vehicle: number;
  stopsNearby: number;
  totalTripFrequency: number;
  nearestStopDist: number;
  nearestGroceryDist: number;
  nearestGroceryName: string;
  groceryAccessible: boolean;
  transitTimeEstimate: number | null;
  score: number;
  centroid: [number, number];
}

// ── Vacancy ─────────────────────────────────────────────────

export interface VacantProperty {
  id: number;
  parcelId: string;
  address: string;
  zip: string;
  lat: number;
  lng: number;
  ward: number;
  neighborhood: string;
  propertyType: "building" | "lot";
  owner: "LRA" | "CITY" | "PRIVATE";
  conditionRating: number;
  lotSqFt: number;
  zoning: string;
  taxYearsDelinquent: number;
  complaintsNearby: number;
  proximityScore: number;
  neighborhoodDemand: number;
  boardUpStatus: string;
  violationCount: number;
  condemned: boolean;
  assessedValue: number;
  yearBuilt: number | null;
  stories: number;
  recentComplaints: { category: string; date: string; status: string }[];
  vacancyCategory: string;
  triageScore: number;
  scoreBreakdown: Record<string, number>;
  bestUse: "housing" | "solar" | "garden";
}

// ── Shared / GeoJSON ────────────────────────────────────────

export interface GeoJSONFeature<P = Record<string, unknown>> {
  type: "Feature";
  properties: P;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][] | number[][][][];
  };
}

export interface GeoJSONCollection<P = Record<string, unknown>> {
  type: "FeatureCollection";
  features: GeoJSONFeature<P>[];
}

export interface NeighborhoodProperties {
  NHD_NUM: number;
  NHD_NAME: string;
  [key: string]: unknown;
}

// ── Dashboard ───────────────────────────────────────────────

export interface KpiItem {
  label: string;
  value: string | number;
  sub?: string;
  color?: "accent" | "success" | "warning" | "danger" | "info";
}

export type MapMode = "choropleth" | "heatmap";

export type VacancyBestUse = "housing" | "solar" | "garden";
