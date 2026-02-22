import { useMemo } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Megaphone01Icon,
  AlertDiamondIcon,
  Bus01Icon,
  Building03Icon,
  Store01Icon,
  UserGroupIcon,
  DollarCircleIcon,
  BubbleChatAddIcon,
} from '@hugeicons/core-free-icons'
import { useData, useExplorer } from './ExplorerProvider'
import { Slider } from '@/components/ui/slider'
import type { LayerToggles, SubToggles } from '@/lib/explorer-types'
import { cn } from '@/lib/utils'

type IconType = typeof Megaphone01Icon

const LAYER_CONFIG: Array<{
  key: keyof LayerToggles
  label: string
  color: string
  desc: string
  icon: IconType
}> = [
  {
    key: 'complaints',
    label: '311 Complaints',
    color: '#4f6ef7',
    desc: 'Complaint density by neighborhood',
    icon: Megaphone01Icon,
  },
  {
    key: 'crime',
    label: 'Crime',
    color: '#f97316',
    desc: 'SLMPD crime incidents',
    icon: AlertDiamondIcon,
  },
  {
    key: 'transit',
    label: 'Transit',
    color: '#60a5fa',
    desc: 'Stops, routes, and walksheds',
    icon: Bus01Icon,
  },
  {
    key: 'vacancy',
    label: 'Vacancy',
    color: '#f59e0b',
    desc: 'Vacant property triage scores',
    icon: Building03Icon,
  },
  {
    key: 'foodAccess',
    label: 'Food Access',
    color: '#ef4444',
    desc: 'Food desert tracts & grocery stores',
    icon: Store01Icon,
  },
  {
    key: 'demographics',
    label: 'Demographics',
    color: '#a855f7',
    desc: 'Census population & housing data',
    icon: UserGroupIcon,
  },
  {
    key: 'arpa',
    label: 'ARPA Funds',
    color: '#10b981',
    desc: 'Federal relief spending analytics',
    icon: DollarCircleIcon,
  },
  {
    key: 'communityVoice',
    label: 'Community Voice',
    color: '#ec4899',
    desc: 'Resident feedback & sentiment',
    icon: BubbleChatAddIcon,
  },
]

export function LayerPanel() {
  const { state, dispatch } = useExplorer()

  const activeCount = Object.values(state.layers).filter(Boolean).length

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[0.8rem] font-semibold tracking-tight text-foreground">
            Layers
          </span>
          <span
            className={cn(
              'flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary/15 px-1.5 text-[0.6rem] font-bold tabular-nums text-primary transition-opacity duration-150',
              activeCount > 0 ? 'opacity-100' : 'opacity-0',
            )}
          >
            {activeCount || 0}
          </span>
        </div>
        <button
          onClick={() => {
            for (const key of Object.keys(state.layers) as Array<
              keyof LayerToggles
            >) {
              if (state.layers[key]) {
                dispatch({ type: 'TOGGLE_LAYER', layer: key })
              }
            }
          }}
          className={cn(
            'text-[0.62rem] font-medium text-foreground/55 transition-all duration-150 hover:text-foreground',
            activeCount > 0 ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          Clear all
        </button>
      </div>

      {/* Layer list */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 pb-3 pt-1">
        {LAYER_CONFIG.map((layer) => {
          const isActive = state.layers[layer.key]
          return (
            <LayerCard
              key={layer.key}
              layer={layer}
              isActive={isActive}
              onToggle={() =>
                dispatch({ type: 'TOGGLE_LAYER', layer: layer.key })
              }
            />
          )
        })}
      </div>
    </div>
  )
}

function LayerCard({
  layer,
  isActive,
  onToggle,
}: {
  layer: (typeof LAYER_CONFIG)[number]
  isActive: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={cn(
        'group relative rounded-lg transition-all duration-200',
        isActive ? 'bg-accent/70' : 'hover:bg-accent/40',
      )}
    >
      {/* Active indicator bar */}
      <div
        className={cn(
          'absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-full transition-all duration-200',
          isActive ? 'opacity-100' : 'opacity-0',
        )}
        style={{ background: layer.color }}
      />

      {/* Main toggle row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left"
      >
        {/* Icon */}
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all duration-200',
          )}
          style={{
            background: isActive
              ? layer.color
              : 'oklch(from var(--color-foreground) l c h / 0.08)',
          }}
        >
          <HugeiconsIcon
            icon={layer.icon}
            strokeWidth={2}
            className={cn(
              'size-3.5 transition-colors duration-200',
              isActive ? 'text-white' : 'text-foreground/60',
            )}
          />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="text-[0.75rem] font-semibold leading-tight text-foreground">
            {layer.label}
          </div>
          <div className="mt-0.5 text-[0.62rem] leading-tight text-foreground/55">
            {layer.desc}
          </div>
        </div>

        {/* Toggle switch */}
        <div
          className={cn(
            'relative h-[18px] w-[32px] shrink-0 rounded-full transition-colors duration-200',
            isActive ? '' : 'bg-border',
          )}
          style={{
            background: isActive ? layer.color : undefined,
          }}
        >
          <div
            className={cn(
              'absolute top-[2px] h-[14px] w-[14px] rounded-full shadow-sm transition-all duration-200',
              isActive ? 'left-[16px] bg-white' : 'left-[2px] bg-foreground/30',
            )}
          />
        </div>
      </button>

      {/* Expandable filters */}
      <div
        className={cn(
          'grid transition-all duration-200',
          isActive
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="px-3.5 pb-2.5 pl-6">
            <div className="flex flex-col gap-1.5">
              <LayerContent layerKey={layer.key} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingIndicator() {
  return (
    <div className="flex items-center gap-2 py-0.5 text-[0.62rem] text-foreground/50">
      <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-muted-foreground/20 border-t-primary" />
      Loading data&hellip;
    </div>
  )
}

function LayerContent({ layerKey }: { layerKey: keyof LayerToggles }) {
  const data = useData()

  const isLoading =
    (layerKey === 'complaints' && !data.csbData) ||
    (layerKey === 'transit' && !data.stops) ||
    (layerKey === 'vacancy' && !data.vacancyData) ||
    (layerKey === 'foodAccess' && !data.foodDeserts) ||
    (layerKey === 'crime' && !data.crimeData) ||
    (layerKey === 'arpa' && !data.arpaData) ||
    (layerKey === 'demographics' && !data.demographicsData)

  if (isLoading) return <LoadingIndicator />

  switch (layerKey) {
    case 'complaints':
      return <ComplaintsFilters />
    case 'transit':
      return <TransitFilters />
    case 'vacancy':
      return <VacancyFilters />
    case 'foodAccess':
      return <FoodAccessFilters />
    case 'crime':
      return <CrimeFilters />
    case 'demographics':
      return <DemographicsFilters />
    case 'arpa':
      return <ArpaFilters />
    case 'communityVoice':
      return <CommunityVoiceFilters />
  }
}

/* ── Shared pill toggle ────────────────────────────────── */

function PillToggle({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="inline-flex w-fit gap-0.5 rounded-md bg-foreground/[0.07] p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-[5px] px-2 py-[3px] text-[0.62rem] font-semibold transition-all duration-150',
            value === opt.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-foreground/55 hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/* ── Tag button for categories ─────────────────────────── */

function TagButton({
  label,
  isActive,
  activeClass,
  onClick,
}: {
  label: string
  isActive: boolean
  activeClass: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md px-1.5 py-[3px] text-[0.62rem] font-semibold transition-all duration-150',
        isActive
          ? activeClass
          : 'bg-foreground/[0.07] text-foreground/65 hover:bg-foreground/[0.12] hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}

/* ── Layer-specific filters ────────────────────────────── */

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
      <PillToggle
        options={[
          { value: 'choropleth', label: 'Choropleth' },
          { value: 'heatmap', label: 'Heatmap' },
        ]}
        value={state.subToggles.complaintsMode}
        onChange={(v) =>
          dispatch({
            type: 'SET_SUB_TOGGLE',
            key: 'complaintsMode',
            value: v,
          })
        }
      />
      <div className="flex flex-wrap gap-1">
        <TagButton
          label="All"
          isActive={state.subToggles.complaintsCategory === 'all'}
          activeClass="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
          onClick={() =>
            dispatch({
              type: 'SET_SUB_TOGGLE',
              key: 'complaintsCategory',
              value: 'all',
            })
          }
        />
        {topCategories.map((cat) => (
          <TagButton
            key={cat}
            label={cat}
            isActive={state.subToggles.complaintsCategory === cat}
            activeClass="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
            onClick={() =>
              dispatch({
                type: 'SET_SUB_TOGGLE',
                key: 'complaintsCategory',
                value: cat,
              })
            }
          />
        ))}
      </div>
    </>
  )
}

function CrimeFilters() {
  const { state, dispatch } = useExplorer()
  const data = useData()

  const topCategories = useMemo(() => {
    if (!data.crimeData) return []
    return Object.entries(data.crimeData.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([cat]) => cat)
  }, [data.crimeData])

  return (
    <>
      <PillToggle
        options={[
          { value: 'choropleth', label: 'Choropleth' },
          { value: 'heatmap', label: 'Heatmap' },
        ]}
        value={state.subToggles.crimeMode}
        onChange={(v) =>
          dispatch({ type: 'SET_SUB_TOGGLE', key: 'crimeMode', value: v })
        }
      />
      <div className="flex flex-wrap gap-1">
        <TagButton
          label="All"
          isActive={state.subToggles.crimeCategory === 'all'}
          activeClass="bg-orange-500/20 text-orange-600 dark:text-orange-400"
          onClick={() =>
            dispatch({
              type: 'SET_SUB_TOGGLE',
              key: 'crimeCategory',
              value: 'all',
            })
          }
        />
        {topCategories.map((cat) => (
          <TagButton
            key={cat}
            label={cat}
            isActive={state.subToggles.crimeCategory === cat}
            activeClass="bg-orange-500/20 text-orange-600 dark:text-orange-400"
            onClick={() =>
              dispatch({
                type: 'SET_SUB_TOGGLE',
                key: 'crimeCategory',
                value: cat,
              })
            }
          />
        ))}
      </div>
    </>
  )
}

function TransitFilters() {
  const { state, dispatch } = useExplorer()

  const toggles: Array<{
    key: keyof SubToggles
    label: string
    color: string
  }> = [
    { key: 'transitStops', label: 'Stops', color: '#60a5fa' },
    { key: 'transitRoutes', label: 'Routes', color: '#a78bfa' },
    {
      key: 'transitWalkshed',
      label: 'Walk Radius',
      color: 'rgba(96,165,250,0.5)',
    },
  ]

  return (
    <>
      {toggles.map((t) => (
        <label
          key={t.key}
          className="group/sub flex cursor-pointer items-center gap-2 rounded-md px-1 py-[3px] transition-colors hover:bg-accent/60"
        >
          <div
            className={cn(
              'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border transition-all duration-150',
              state.subToggles[t.key]
                ? 'border-transparent'
                : 'border-muted-foreground/40 bg-transparent',
            )}
            style={{
              background: state.subToggles[t.key] ? t.color : undefined,
            }}
          >
            {state.subToggles[t.key] && (
              <svg
                viewBox="0 0 12 12"
                className="h-2.5 w-2.5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.5 6L5 8.5L9.5 3.5" />
              </svg>
            )}
          </div>
          <span className="text-[0.62rem] font-medium text-foreground/60 transition-colors group-hover/sub:text-foreground">
            {t.label}
          </span>
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
            className="sr-only"
          />
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
    'w-full appearance-none rounded-md border border-border/60 bg-muted/60 px-2 py-1.5 text-[0.62rem] font-medium text-foreground outline-none transition-colors hover:border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20'

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
      {/* Score range slider */}
      <div className="flex flex-col gap-1 pt-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[0.62rem] font-medium text-foreground/60">
            Score Range
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[0.62rem] font-bold tabular-nums text-foreground">
            {state.subToggles.vacancyMinScore}–
            {state.subToggles.vacancyMaxScore}
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[
            state.subToggles.vacancyMinScore,
            state.subToggles.vacancyMaxScore,
          ]}
          onValueChange={(values) => {
            dispatch({
              type: 'SET_SUB_TOGGLE',
              key: 'vacancyMinScore',
              value: values[0],
            })
            dispatch({
              type: 'SET_SUB_TOGGLE',
              key: 'vacancyMaxScore',
              value: values[1],
            })
          }}
        />
      </div>
    </>
  )
}

function FoodAccessFilters() {
  const { state, dispatch } = useExplorer()

  const toggles = [
    {
      key: 'foodDesertTracts' as keyof SubToggles,
      label: 'Desert Tracts (LILA)',
      color: '#ef4444',
    },
    {
      key: 'groceryStores' as keyof SubToggles,
      label: 'Grocery Stores',
      color: '#10b981',
    },
  ]

  return (
    <>
      {toggles.map((t) => (
        <label
          key={t.key}
          className="group/sub flex cursor-pointer items-center gap-2 rounded-md px-1 py-[3px] transition-colors hover:bg-accent/60"
        >
          <div
            className={cn(
              'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border transition-all duration-150',
              state.subToggles[t.key]
                ? 'border-transparent'
                : 'border-muted-foreground/40 bg-transparent',
            )}
            style={{
              background: state.subToggles[t.key] ? t.color : undefined,
            }}
          >
            {state.subToggles[t.key] && (
              <svg
                viewBox="0 0 12 12"
                className="h-2.5 w-2.5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.5 6L5 8.5L9.5 3.5" />
              </svg>
            )}
          </div>
          <span className="text-[0.62rem] font-medium text-foreground/60 transition-colors group-hover/sub:text-foreground">
            {t.label}
          </span>
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
            className="sr-only"
          />
        </label>
      ))}
    </>
  )
}

function DemographicsFilters() {
  const { state, dispatch } = useExplorer()

  const metrics: Array<{
    value: string
    label: string
  }> = [
    { value: 'population', label: 'Population' },
    { value: 'vacancyRate', label: 'Vacancy Rate' },
    { value: 'popChange', label: 'Pop Change' },
  ]

  return (
    <div className="flex flex-wrap gap-1">
      {metrics.map((m) => (
        <TagButton
          key={m.value}
          label={m.label}
          isActive={state.subToggles.demographicsMetric === m.value}
          activeClass="bg-purple-500/20 text-purple-600 dark:text-purple-400"
          onClick={() =>
            dispatch({
              type: 'SET_SUB_TOGGLE',
              key: 'demographicsMetric',
              value: m.value,
            })
          }
        />
      ))}
    </div>
  )
}

function ArpaFilters() {
  return (
    <div className="flex items-center gap-1.5 text-[0.62rem] text-foreground/50">
      <div className="h-1 w-1 rounded-full bg-emerald-500/60" />
      Analytics-only layer
    </div>
  )
}

function CommunityVoiceFilters() {
  return (
    <div className="flex flex-col gap-1.5 text-[0.62rem]">
      <div className="flex items-center gap-1.5 text-foreground/50">
        <div className="h-1 w-1 rounded-full bg-pink-500/60" />
        Click markers to read resident quotes
      </div>
      <div className="flex flex-wrap gap-1 pt-1">
        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400">
          Positive
        </span>
        <span className="rounded bg-gray-500/20 px-1.5 py-0.5 text-gray-600 dark:text-gray-400">
          Neutral
        </span>
        <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-red-600 dark:text-red-400">
          Concern
        </span>
      </div>
    </div>
  )
}
