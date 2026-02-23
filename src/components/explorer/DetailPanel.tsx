import { useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  Building03Icon,
  Bus01Icon,
  Store01Icon,
  AlertDiamondIcon,
  Group01Icon,
} from '@hugeicons/core-free-icons'
import { useExplorer } from './ExplorerProvider'
import { NeighborhoodDetail } from './detail/NeighborhoodDetail'
import { VacancyDetail } from './detail/VacancyDetail'
import { StopDetail } from './detail/StopDetail'
import { GroceryDetail } from './detail/GroceryDetail'
import { FoodDesertDetail } from './detail/FoodDesertDetail'
import { NeighborhoodComparePanel } from './detail/NeighborhoodComparePanel'
import { Switch } from '@/components/ui/switch'

type IconType = typeof Building03Icon

const ENTITY_CONFIG: Record<
  string,
  { label: string; color: string; icon: IconType }
> = {
  neighborhood: { label: 'Neighborhood', color: '#6366f1', icon: Group01Icon },
  vacancy: {
    label: 'Vacant Property',
    color: '#f59e0b',
    icon: Building03Icon,
  },
  stop: { label: 'Transit Stop', color: '#60a5fa', icon: Bus01Icon },
  grocery: { label: 'Grocery Store', color: '#10b981', icon: Store01Icon },
  foodDesert: {
    label: 'Food Desert',
    color: '#ef4444',
    icon: AlertDiamondIcon,
  },
}

export function DetailPanel() {
  const { state, dispatch } = useExplorer()

  // Cache last selected value so content stays visible during close animation
  const cachedSelected = useRef(state.selected)
  if (state.selected) {
    cachedSelected.current = state.selected
  }
  const displaySelected = state.detailPanelOpen
    ? (state.selected ?? cachedSelected.current)
    : cachedSelected.current

  const config = displaySelected
    ? ENTITY_CONFIG[displaySelected.type]
    : undefined
  if (state.compareMode) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border/60">
          <div
            className="h-[3px]"
            style={{ background: ENTITY_CONFIG.neighborhood.color }}
          />
          <div className="flex items-center gap-2.5 px-4 py-2.5">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
              style={{ background: ENTITY_CONFIG.neighborhood.color }}
            >
              <HugeiconsIcon
                icon={ENTITY_CONFIG.neighborhood.icon}
                strokeWidth={2}
                className="size-3 text-white"
              />
            </div>
            <span className="text-[0.7rem] font-semibold text-foreground">
              Neighborhood
            </span>
            <div className="flex-1" />
            <button
              onClick={() => dispatch({ type: 'TOGGLE_COMPARE_MODE' })}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                strokeWidth={2}
                className="size-3.5"
              />
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-border/40 px-4 py-2">
            <span className="text-[0.62rem] font-medium text-muted-foreground">
              Compare mode
            </span>
            <Switch
              checked={state.compareMode}
              onCheckedChange={() =>
                dispatch({ type: 'TOGGLE_COMPARE_MODE' })
              }
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NeighborhoodComparePanel
            neighborhoodA={state.compareNeighborhoodA}
            neighborhoodB={state.compareNeighborhoodB}
          />
        </div>
      </div>
    )
  }

  if (!displaySelected || !config) return null

  return (
    <div className="flex h-full flex-col">
      {/* Entity header */}
      <div className="border-b border-border/60">
        <div className="h-[3px]" style={{ background: config.color }} />
        <div className="flex items-center gap-2.5 px-4 py-2.5">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
            style={{ background: config.color }}
          >
            <HugeiconsIcon
              icon={config.icon}
              strokeWidth={2}
              className="size-3 text-white"
            />
          </div>
          <span className="text-[0.7rem] font-semibold text-foreground">
            {config.label}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
          </button>
        </div>
        {displaySelected.type === 'neighborhood' && (
          <div className="flex items-center justify-between border-t border-border/40 px-4 py-2">
            <span className="text-[0.62rem] font-medium text-muted-foreground">
              Compare neighborhoods
            </span>
            <Switch
              checked={state.compareMode}
              onCheckedChange={() =>
                dispatch({ type: 'TOGGLE_COMPARE_MODE' })
              }
            />
          </div>
        )}
      </div>

      {/* Detail content */}
      <div className="flex-1 overflow-y-auto p-4">
        {displaySelected.type === 'neighborhood' && (
          <NeighborhoodDetail id={displaySelected.id} />
        )}
        {displaySelected.type === 'vacancy' && (
          <VacancyDetail id={displaySelected.id} />
        )}
        {displaySelected.type === 'stop' && (
          <StopDetail id={displaySelected.id} />
        )}
        {displaySelected.type === 'grocery' && (
          <GroceryDetail id={displaySelected.id} />
        )}
        {displaySelected.type === 'foodDesert' && (
          <FoodDesertDetail id={displaySelected.id} />
        )}
      </div>
    </div>
  )
}
