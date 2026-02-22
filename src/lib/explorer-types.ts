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
  | { type: 'communityVoice'; id: string }

// ── Layer State ────────────────────────────────────────────

export interface LayerToggles {
  complaints: boolean
  transit: boolean
  vacancy: boolean
  foodAccess: boolean
  crime: boolean
  arpa: boolean
  demographics: boolean
  communityVoice: boolean
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
  vacancyMaxScore: number
  foodDesertTracts: boolean
  groceryStores: boolean
  crimeMode: 'choropleth' | 'heatmap'
  crimeCategory: string
  timeRangeStart: string
  timeRangeEnd: string
  arpaCategory: string
  demographicsMetric: 'population' | 'vacancyRate' | 'popChange'
}

export type MapStyle = 'light' | 'dark' | 'satellite' | 'streets'

export interface ExplorerState {
  layers: LayerToggles
  subToggles: SubToggles
  selected: SelectedEntity | null
  detailPanelOpen: boolean
  analyticsPanelExpanded: boolean
  analyticsPanelHeight: number
  analyticsTab: string | null
  mapStyle: MapStyle
  compareMode: boolean
  compareNeighborhoodA: string | null
  compareNeighborhoodB: string | null
  priceMode?: boolean
  priceYear?: number
  priceNeighborhoodA?: string | null
  priceNeighborhoodB?: string | null
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
  | { type: 'SET_ANALYTICS_TAB'; tab: string }
  | { type: 'SET_MAP_STYLE'; style: MapStyle }
  | { type: 'TOGGLE_COMPARE_MODE' }
  | { type: 'SET_COMPARE_NEIGHBORHOOD'; slot: 'A' | 'B'; id: string }
  | { type: 'CLEAR_COMPARE_NEIGHBORHOOD'; slot: 'A' | 'B' }
  | { type: 'TOGGLE_PRICE_MODE' }
  | { type: 'SET_PRICE_YEAR'; year: number }
  | { type: 'SET_PRICE_NEIGHBORHOOD'; slot: 'A' | 'B'; id: string }
  | { type: 'CLEAR_PRICE_NEIGHBORHOOD'; slot: 'A' | 'B' }

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
    communityVoice: false,
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
    vacancyMaxScore: 100,
    foodDesertTracts: true,
    groceryStores: true,
    crimeMode: 'choropleth',
    crimeCategory: 'all',
    timeRangeStart: '',
    timeRangeEnd: '',
    arpaCategory: 'all',
    demographicsMetric: 'population',
  },
  selected: null,
  detailPanelOpen: false,
  analyticsPanelExpanded: false,
  analyticsPanelHeight: 600,
  analyticsTab: null,
  mapStyle: 'streets',
  compareMode: false,
  compareNeighborhoodA: null,
  compareNeighborhoodB: null,
}
