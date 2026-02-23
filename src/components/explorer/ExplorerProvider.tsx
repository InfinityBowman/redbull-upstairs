import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type {
  ExplorerAction,
  ExplorerData,
  ExplorerState,
  LayerToggles,
} from '@/lib/explorer-types'
import { initialExplorerState } from '@/lib/explorer-types'

// ── Reducer ────────────────────────────────────────────────

function explorerReducer(
  state: ExplorerState,
  action: ExplorerAction,
): ExplorerState {
  switch (action.type) {
    case 'TOGGLE_LAYER':
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.layer]: !state.layers[action.layer],
        },
      }
    case 'SET_SUB_TOGGLE':
      return {
        ...state,
        subToggles: { ...state.subToggles, [action.key]: action.value },
      }
    case 'SELECT_ENTITY':
      return { ...state, selected: action.entity, detailPanelOpen: true }
    case 'CLEAR_SELECTION':
      return { ...state, selected: null, detailPanelOpen: false }
    case 'CLOSE_DETAIL':
      return { ...state, detailPanelOpen: false }
    case 'TOGGLE_ANALYTICS':
      return { ...state, analyticsPanelExpanded: !state.analyticsPanelExpanded }
    case 'SET_ANALYTICS_TAB':
      return { ...state, analyticsTab: action.tab }
    case 'SET_ANALYTICS_HEIGHT':
      return {
        ...state,
        analyticsPanelHeight: Math.min(800, Math.max(150, action.height)),
      }
    case 'SET_MAP_STYLE':
      return { ...state, mapStyle: action.style }
    case 'TOGGLE_COMPARE_MODE': {
      const entering = !state.compareMode
      // When entering compare mode with a neighborhood selected, pre-fill it as A
      const prefillA =
        entering && state.selected?.type === 'neighborhood'
          ? state.selected.id
          : null
      return {
        ...state,
        compareMode: entering,
        compareNeighborhoodA: prefillA,
        compareNeighborhoodB: null,
        detailPanelOpen: true,
      }
    }
    case 'SET_COMPARE_NEIGHBORHOOD':
      return {
        ...state,
        [`compareNeighborhood${action.slot}`]: action.id,
      }
    case 'CLEAR_COMPARE_NEIGHBORHOOD':
      return {
        ...state,
        [`compareNeighborhood${action.slot}`]: null,
      }
    default:
      return state
  }
}

// ── Contexts ───────────────────────────────────────────────

const ExplorerContext = createContext<{
  state: ExplorerState
  dispatch: React.Dispatch<ExplorerAction>
  loadLayerData: (layer: keyof LayerToggles) => void
} | null>(null)

const DataContext = createContext<ExplorerData | null>(null)
const FailedDatasetsContext = createContext<Set<string>>(new Set())

// ── Hooks ──────────────────────────────────────────────────

export function useExplorer() {
  const ctx = useContext(ExplorerContext)
  if (!ctx) throw new Error('useExplorer must be used within ExplorerProvider')
  return ctx
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within ExplorerProvider')
  return ctx
}

export function useFailedDatasets() {
  return useContext(FailedDatasetsContext)
}

// ── Provider ───────────────────────────────────────────────

export function ExplorerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(explorerReducer, initialExplorerState)
  const [data, setData] = useState<ExplorerData>({
    neighborhoods: null,
    routes: null,
    groceryStores: null,
    csbData: null,
    trendsData: null,
    stops: null,
    shapes: null,
    stopStats: null,
    foodDeserts: null,
    vacancyData: null,
    crimeData: null,
    arpaData: null,
    demographicsData: null,
  })

  // Track which datasets have been fetched to avoid double-fetch
  const fetched = useRef<Set<string>>(new Set())
  const [failedDatasets, setFailedDatasets] = useState<Set<string>>(new Set())
  const markFailed = useCallback((layer: string) => {
    setFailedDatasets((prev) => {
      const next = new Set(prev)
      next.add(layer)
      return next
    })
  }, [])

  // Always load base datasets on mount
  useEffect(() => {
    Promise.all([
      fetch('/data/neighborhoods.geojson').then((r) => {
        if (!r.ok) throw new Error('Failed to load neighborhoods')
        return r.json()
      }),
      fetch('/data/routes.json').then((r) => {
        if (!r.ok) throw new Error('Failed to load routes')
        return r.json()
      }),
      fetch('/data/grocery_stores.geojson').then((r) => {
        if (!r.ok) throw new Error('Failed to load grocery stores')
        return r.json()
      }),
    ])
      .then(([neighborhoods, routes, groceryStores]) => {
        setData((prev) => ({ ...prev, neighborhoods, routes, groceryStores }))
      })
      .catch((err) => {
        console.error('Failed to load base data:', err)
      })
  }, [])

  // Lazy-load datasets based on active layers
  const loadLayerData = useCallback((layer: keyof LayerToggles) => {
    if (fetched.current.has(layer)) return
    fetched.current.add(layer)

    switch (layer) {
      case 'complaints':
        Promise.all([
          fetch('/data/csb_latest.json').then((r) => {
            if (!r.ok) throw new Error('not found')
            return r.json()
          }),
          fetch('/data/trends.json').then((r) => {
            if (!r.ok) throw new Error('not found')
            return r.json()
          }),
        ])
          .then(([csbData, trendsData]) => {
            setData((prev) => ({ ...prev, csbData, trendsData }))
          })
          .catch(() => markFailed('complaints'))
        break

      case 'transit':
        Promise.all([
          fetch('/data/stops.geojson').then((r) => {
            if (!r.ok) throw new Error('not found')
            return r.json()
          }),
          fetch('/data/shapes.geojson')
            .then((r) => r.json())
            .catch(() => null),
          fetch('/data/stop_stats.json').then((r) => {
            if (!r.ok) throw new Error('not found')
            return r.json()
          }),
        ])
          .then(([stops, shapes, stopStats]) => {
            setData((prev) => ({ ...prev, stops, shapes, stopStats }))
          })
          .catch(() => markFailed('transit'))
        break

      case 'vacancy':
        fetch('/data/vacancies.json')
          .then((r) => {
            if (!r.ok) throw new Error('not found')
            return r.json()
          })
          .then((vacancyData) => {
            setData((prev) => ({ ...prev, vacancyData }))
          })
          .catch(() => markFailed('vacancy'))
        break

      case 'foodAccess':
        fetch('/data/food_deserts.geojson')
          .then((r) => {
            if (!r.ok) throw new Error('not found')
            return r.json()
          })
          .then((foodDeserts) => {
            setData((prev) => ({ ...prev, foodDeserts }))
          })
          .catch(() => markFailed('foodAccess'))
        break

      case 'crime':
        fetch('/data/crime.json')
          .then((r) => {
            if (!r.ok) throw new Error('not found')
            return r.json()
          })
          .then((crimeData) => {
            setData((prev) => ({ ...prev, crimeData }))
          })
          .catch(() => markFailed('crime'))
        break

      case 'arpa':
        fetch('/data/arpa.json')
          .then((r) => {
            if (!r.ok) throw new Error('not found')
            return r.json()
          })
          .then((arpaData) => {
            setData((prev) => ({ ...prev, arpaData }))
          })
          .catch(() => markFailed('arpa'))
        break

      case 'demographics':
        fetch('/data/demographics.json')
          .then((r) => {
            if (!r.ok) throw new Error('not found')
            return r.json()
          })
          .then((demographicsData) => {
            setData((prev) => ({ ...prev, demographicsData }))
          })
          .catch(() => markFailed('demographics'))
        break
    }
  }, [])

  // Eagerly load ALL datasets on mount so the AI chat can query any data
  // without requiring the user to enable layers first.
  // The `fetched` ref prevents double-fetching when layers are later toggled.
  useEffect(() => {
    loadLayerData('complaints')
    loadLayerData('crime')
    loadLayerData('transit')
    loadLayerData('vacancy')
    loadLayerData('foodAccess')
    loadLayerData('arpa')
    loadLayerData('demographics')
  }, [loadLayerData])

  // Trigger lazy loads when layers are toggled on
  useEffect(() => {
    ;(Object.keys(state.layers) as Array<keyof LayerToggles>).forEach(
      (layer) => {
        if (state.layers[layer]) loadLayerData(layer)
      },
    )
    // Transit analytics needs food desert data for equity gap scoring
    if (state.layers.transit) loadLayerData('foodAccess')
  }, [state.layers, loadLayerData])

  // Eagerly load ALL datasets when a neighborhood is selected
  // so the composite score reflects reality regardless of layer toggles
  useEffect(() => {
    if (state.selected?.type === 'neighborhood') {
      loadLayerData('complaints')
      loadLayerData('transit')
      loadLayerData('vacancy')
      loadLayerData('foodAccess')
      loadLayerData('crime')
      loadLayerData('demographics')
    }
  }, [state.selected, loadLayerData])

  // Also load data when compare mode neighborhoods are selected
  useEffect(() => {
    if (state.compareNeighborhoodA || state.compareNeighborhoodB) {
      loadLayerData('complaints')
      loadLayerData('transit')
      loadLayerData('vacancy')
      loadLayerData('foodAccess')
    }
  }, [state.compareNeighborhoodA, state.compareNeighborhoodB, loadLayerData])

  return (
    <ExplorerContext.Provider value={{ state, dispatch, loadLayerData }}>
      <DataContext.Provider value={data}>
        <FailedDatasetsContext.Provider value={failedDatasets}>
          {children}
        </FailedDatasetsContext.Provider>
      </DataContext.Provider>
    </ExplorerContext.Provider>
  )
}
