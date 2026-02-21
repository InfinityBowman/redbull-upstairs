import {
  
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState
} from 'react'
import type {ReactNode} from 'react';
import type {
  ExplorerAction,
  ExplorerData,
  ExplorerState,
  LayerToggles,
} from '@/lib/explorer-types'
import { generateVacancyData } from '@/lib/vacancy-data'
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
    default:
      return state
  }
}

// ── Contexts ───────────────────────────────────────────────

const ExplorerContext = createContext<{
  state: ExplorerState
  dispatch: React.Dispatch<ExplorerAction>
} | null>(null)

const DataContext = createContext<ExplorerData | null>(null)

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
  })

  // Track which datasets have been fetched to avoid double-fetch
  const fetched = useRef<Set<string>>(new Set())

  // Always load base datasets on mount
  useEffect(() => {
    Promise.all([
      fetch('/data/neighborhoods.geojson').then((r) => r.json()),
      fetch('/data/routes.json').then((r) => r.json()),
      fetch('/data/grocery_stores.geojson').then((r) => r.json()),
    ]).then(([neighborhoods, routes, groceryStores]) => {
      setData((prev) => ({ ...prev, neighborhoods, routes, groceryStores }))
    })
  }, [])

  // Lazy-load datasets based on active layers
  const loadLayerData = useCallback((layer: keyof LayerToggles) => {
    if (fetched.current.has(layer)) return
    fetched.current.add(layer)

    switch (layer) {
      case 'complaints':
        Promise.all([
          fetch('/data/csb_latest.json').then((r) => r.json()),
          fetch('/data/trends.json').then((r) => r.json()),
        ]).then(([csbData, trendsData]) => {
          setData((prev) => ({ ...prev, csbData, trendsData }))
        })
        break

      case 'transit':
        Promise.all([
          fetch('/data/stops.geojson').then((r) => r.json()),
          fetch('/data/shapes.geojson')
            .then((r) => r.json())
            .catch(() => null),
          fetch('/data/stop_stats.json').then((r) => r.json()),
        ]).then(([stops, shapes, stopStats]) => {
          setData((prev) => ({ ...prev, stops, shapes, stopStats }))
        })
        break

      case 'vacancy':
        setData((prev) => ({ ...prev, vacancyData: generateVacancyData() }))
        break

      case 'foodAccess':
        fetch('/data/food_deserts.geojson')
          .then((r) => r.json())
          .then((foodDeserts) => {
            setData((prev) => ({ ...prev, foodDeserts }))
          })
        break
    }
  }, [])

  // Trigger lazy loads when layers are toggled on
  useEffect(() => {
    ;(Object.keys(state.layers) as Array<keyof LayerToggles>).forEach((layer) => {
      if (state.layers[layer]) loadLayerData(layer)
    })
  }, [state.layers, loadLayerData])

  // Eagerly load ALL datasets when a neighborhood is selected
  // so the composite score reflects reality regardless of layer toggles
  useEffect(() => {
    if (state.selected?.type === 'neighborhood') {
      loadLayerData('complaints')
      loadLayerData('transit')
      loadLayerData('vacancy')
      loadLayerData('foodAccess')
    }
  }, [state.selected, loadLayerData])

  return (
    <ExplorerContext.Provider value={{ state, dispatch }}>
      <DataContext.Provider value={data}>{children}</DataContext.Provider>
    </ExplorerContext.Provider>
  )
}
