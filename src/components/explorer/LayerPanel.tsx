import { useMemo } from 'react'
import { useData, useExplorer } from './ExplorerProvider'
import type { LayerToggles, SubToggles } from '@/lib/explorer-types'
import { cn } from '@/lib/utils'

const LAYER_CONFIG: Array<{
  key: keyof LayerToggles
  label: string
  color: string
  desc: string
}> = [
  {
    key: 'complaints',
    label: '311 Complaints',
    color: '#6366f1',
    desc: 'Complaint density by neighborhood',
  },
  {
    key: 'transit',
    label: 'Transit',
    color: '#60a5fa',
    desc: 'Stops, routes, and walksheds',
  },
  {
    key: 'vacancy',
    label: 'Vacancy',
    color: '#f59e0b',
    desc: 'Vacant property triage scores',
  },
  {
    key: 'foodAccess',
    label: 'Food Access',
    color: '#ef4444',
    desc: 'Food desert tracts and grocery stores',
  },
]

export function LayerPanel() {
  const { state, dispatch } = useExplorer()
  const data = useData()

  return (
    <div className="flex flex-col gap-0.5 p-3">
      <div className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
        Layers
      </div>

      {LAYER_CONFIG.map((layer) => (
        <div key={layer.key}>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent">
            <input
              type="checkbox"
              checked={state.layers[layer.key]}
              onChange={() =>
                dispatch({ type: 'TOGGLE_LAYER', layer: layer.key })
              }
              className="h-4 w-4 accent-primary"
            />
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: layer.color }}
            />
            <div className="min-w-0">
              <div className="text-xs font-semibold">{layer.label}</div>
              <div className="text-[0.6rem] text-muted-foreground">
                {layer.desc}
              </div>
            </div>
          </label>

          {/* Contextual sub-filters when layer is active */}
          {state.layers[layer.key] && (
            <div className="ml-8 mt-1 mb-2 flex flex-col gap-1.5">
              {layer.key === 'complaints' && <ComplaintsFilters />}
              {layer.key === 'transit' && <TransitFilters />}
              {layer.key === 'vacancy' && <VacancyFilters />}
              {layer.key === 'foodAccess' && <FoodAccessFilters />}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ComplaintsFilters() {
  const { state, dispatch } = useExplorer()
  const data = useData()

  const topCategories = useMemo(() => {
    if (!data.csbData) return []
    return Object.entries(data.csbData.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([cat]) => cat)
  }, [data.csbData])

  return (
    <>
      <div className="flex gap-1">
        {(['choropleth', 'heatmap'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() =>
              dispatch({
                type: 'SET_SUB_TOGGLE',
                key: 'complaintsMode',
                value: mode,
              })
            }
            className={cn(
              'rounded px-2 py-0.5 text-[0.65rem] font-medium transition-colors',
              state.subToggles.complaintsMode === mode
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent',
            )}
          >
            {mode === 'choropleth' ? 'Choropleth' : 'Heatmap'}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() =>
            dispatch({
              type: 'SET_SUB_TOGGLE',
              key: 'complaintsCategory',
              value: 'all',
            })
          }
          className={cn(
            'rounded px-1.5 py-0.5 text-[0.6rem] font-medium transition-colors',
            state.subToggles.complaintsCategory === 'all'
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'bg-muted text-muted-foreground hover:bg-accent',
          )}
        >
          All
        </button>
        {topCategories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              dispatch({
                type: 'SET_SUB_TOGGLE',
                key: 'complaintsCategory',
                value: cat,
              })
            }
            className={cn(
              'rounded px-1.5 py-0.5 text-[0.6rem] font-medium transition-colors',
              state.subToggles.complaintsCategory === cat
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-muted text-muted-foreground hover:bg-accent',
            )}
          >
            {cat}
          </button>
        ))}
      </div>
    </>
  )
}

function TransitFilters() {
  const { state, dispatch } = useExplorer()

  const toggles: Array<{ key: keyof SubToggles; label: string; color: string }> = [
    { key: 'transitStops', label: 'Stops', color: '#60a5fa' },
    { key: 'transitRoutes', label: 'Routes', color: '#a78bfa' },
    {
      key: 'transitWalkshed',
      label: 'Walk Radius',
      color: 'rgba(96,165,250,0.3)',
    },
  ]

  return (
    <>
      {toggles.map((t) => (
        <label
          key={t.key}
          className="flex cursor-pointer items-center gap-2 text-[0.65rem]"
        >
          <input
            type="checkbox"
            checked={state.subToggles[t.key] as boolean}
            onChange={() =>
              dispatch({
                type: 'SET_SUB_TOGGLE',
                key: t.key,
                value: !state.subToggles[t.key],
              })
            }
            className="h-3 w-3 accent-primary"
          />
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: t.color }}
          />
          <span className="text-muted-foreground">{t.label}</span>
        </label>
      ))}
    </>
  )
}

function VacancyFilters() {
  const { state, dispatch } = useExplorer()
  const data = useData()

  const neighborhoods = useMemo(() => {
    if (!data.vacancyData) return []
    return [...new Set(data.vacancyData.map((p) => p.neighborhood))].sort()
  }, [data.vacancyData])

  const selectClass =
    'w-full rounded border border-border bg-muted px-1.5 py-1 text-[0.65rem] text-foreground'

  return (
    <>
      <select
        value={state.subToggles.vacancyUseFilter}
        onChange={(e) =>
          dispatch({
            type: 'SET_SUB_TOGGLE',
            key: 'vacancyUseFilter',
            value: e.target.value,
          })
        }
        className={selectClass}
      >
        <option value="all">All Best Uses</option>
        <option value="housing">Housing</option>
        <option value="solar">Solar</option>
        <option value="garden">Garden</option>
      </select>
      <select
        value={state.subToggles.vacancyOwnerFilter}
        onChange={(e) =>
          dispatch({
            type: 'SET_SUB_TOGGLE',
            key: 'vacancyOwnerFilter',
            value: e.target.value,
          })
        }
        className={selectClass}
      >
        <option value="all">All Owners</option>
        <option value="lra">LRA</option>
        <option value="city">City</option>
        <option value="private">Private</option>
      </select>
      <select
        value={state.subToggles.vacancyTypeFilter}
        onChange={(e) =>
          dispatch({
            type: 'SET_SUB_TOGGLE',
            key: 'vacancyTypeFilter',
            value: e.target.value,
          })
        }
        className={selectClass}
      >
        <option value="all">All Types</option>
        <option value="building">Buildings</option>
        <option value="lot">Lots</option>
      </select>
      <select
        value={state.subToggles.vacancyHoodFilter}
        onChange={(e) =>
          dispatch({
            type: 'SET_SUB_TOGGLE',
            key: 'vacancyHoodFilter',
            value: e.target.value,
          })
        }
        className={selectClass}
      >
        <option value="all">All Neighborhoods</option>
        {neighborhoods.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1.5">
        <span className="text-[0.6rem] text-muted-foreground">
          Min Score: {state.subToggles.vacancyMinScore}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={state.subToggles.vacancyMinScore}
          onChange={(e) =>
            dispatch({
              type: 'SET_SUB_TOGGLE',
              key: 'vacancyMinScore',
              value: +e.target.value,
            })
          }
          className="w-full accent-primary"
        />
      </div>
    </>
  )
}

function FoodAccessFilters() {
  const { state, dispatch } = useExplorer()

  return (
    <>
      <label className="flex cursor-pointer items-center gap-2 text-[0.65rem]">
        <input
          type="checkbox"
          checked={state.subToggles.foodDesertTracts}
          onChange={() =>
            dispatch({
              type: 'SET_SUB_TOGGLE',
              key: 'foodDesertTracts',
              value: !state.subToggles.foodDesertTracts,
            })
          }
          className="h-3 w-3 accent-primary"
        />
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-muted-foreground">Desert Tracts (LILA)</span>
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-[0.65rem]">
        <input
          type="checkbox"
          checked={state.subToggles.groceryStores}
          onChange={() =>
            dispatch({
              type: 'SET_SUB_TOGGLE',
              key: 'groceryStores',
              value: !state.subToggles.groceryStores,
            })
          }
          className="h-3 w-3 accent-primary"
        />
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-muted-foreground">Grocery Stores</span>
      </label>
    </>
  )
}
