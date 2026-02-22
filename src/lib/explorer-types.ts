import type {
  ArpaData,
  CrimeData,
  CSBData,
  FoodDesertProperties,
  GeoJSONCollection,
  NeighborhoodDemographics,
  NeighborhoodProperties,
  StopStats,
  TransitRoute,
  TrendsData,
  VacantProperty,
} from './types'

// ── Selected Entity ────────────────────────────────────────

export type SelectedEntity =
  | { type: 'neighborhood'; id: string }
  | { type: 'stop'; id: string }
  | { type: 'vacancy'; id: number }
  | { type: 'grocery'; id: number }
  | { type: 'foodDesert'; id: string }

// ── Layer State ────────────────────────────────────────────

export interface LayerToggles {
  complaints: boolean
  transit: boolean
  vacancy: boolean
  foodAccess: boolean
  crime: boolean
  arpa: boolean
  demographics: boolean
}

export interface SubToggles {
  complaintsMode: 'choropleth' | 'heatmap'
  complaintsCategory: string
  transitStops: boolean
  transitRoutes: boolean
  transitWalkshed: boolean
  vacancyUseFilter: string
  vacancyOwnerFilter: string
  vacancyTypeFilter: string
  vacancyHoodFilter: string
  vacancyMinScore: number
  foodDesertTracts: boolean
  groceryStores: boolean
  crimeMode: 'choropleth' | 'heatmap'
  crimeCategory: string
  arpaCategory: string
  demographicsMetric: 'population' | 'vacancyRate' | 'popChange'
}

export interface ExplorerState {
  layers: LayerToggles
  subToggles: SubToggles
  selected: SelectedEntity | null
  detailPanelOpen: boolean
  analyticsPanelExpanded: boolean
  analyticsPanelHeight: number
}

// ── Actions ────────────────────────────────────────────────

export type ExplorerAction =
  | { type: 'TOGGLE_LAYER'; layer: keyof LayerToggles }
  | {
      type: 'SET_SUB_TOGGLE'
      key: keyof SubToggles
      value: string | number | boolean
    }
  | { type: 'SELECT_ENTITY'; entity: SelectedEntity }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'TOGGLE_ANALYTICS' }
  | { type: 'SET_ANALYTICS_HEIGHT'; height: number }
  | { type: 'CLOSE_DETAIL' }

// ── Data Context ───────────────────────────────────────────

export interface ExplorerData {
  neighborhoods: GeoJSONCollection<NeighborhoodProperties> | null
  routes: Array<TransitRoute> | null
  groceryStores: GeoJSONCollection<{ name: string; chain: string }> | null
  csbData: CSBData | null
  trendsData: TrendsData | null
  stops: GeoJSONCollection | null
  shapes: GeoJSONCollection | null
  stopStats: Record<string, StopStats> | null
  foodDeserts: GeoJSONCollection<FoodDesertProperties> | null
  vacancyData: Array<VacantProperty> | null
  crimeData: CrimeData | null
  arpaData: ArpaData | null
  demographicsData: Record<string, NeighborhoodDemographics> | null
}

// ── Initial State ──────────────────────────────────────────

export const initialExplorerState: ExplorerState = {
  layers: {
    complaints: true,
    transit: false,
    vacancy: false,
    foodAccess: false,
    crime: false,
    arpa: false,
    demographics: false,
  },
  subToggles: {
    complaintsMode: 'choropleth',
    complaintsCategory: 'all',
    transitStops: true,
    transitRoutes: true,
    transitWalkshed: false,
    vacancyUseFilter: 'all',
    vacancyOwnerFilter: 'all',
    vacancyTypeFilter: 'all',
    vacancyHoodFilter: 'all',
    vacancyMinScore: 0,
    foodDesertTracts: true,
    groceryStores: true,
    crimeMode: 'choropleth',
    crimeCategory: 'all',
    arpaCategory: 'all',
    demographicsMetric: 'population',
  },
  selected: null,
  detailPanelOpen: false,
  analyticsPanelExpanded: false,
  analyticsPanelHeight: 600,
}
