import { useCallback, useEffect, useRef } from 'react'
import { useData, useExplorer } from '@/components/explorer/ExplorerProvider'
import { ComplaintsAnalytics } from './analytics/ComplaintsAnalytics'
import { TransitAnalytics } from './analytics/TransitAnalytics'
import { VacancyAnalytics } from './analytics/VacancyAnalytics'
import { NeighborhoodAnalytics } from './analytics/NeighborhoodAnalytics'
import { ChartBuilder } from './analytics/ChartBuilder'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export function AnalyticsPanel() {
  const { state, dispatch } = useExplorer()
  const data = useData()
  const dragRef = useRef<{ startY: number; startH: number } | null>(null)
  const heightRef = useRef(state.analyticsPanelHeight)

  useEffect(() => {
    heightRef.current = state.analyticsPanelHeight
  }, [state.analyticsPanelHeight])

  // Clean up window listeners if component unmounts mid-drag
  useEffect(() => {
    return () => {
      dragRef.current = null
    }
  }, [])

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragRef.current = { startY: e.clientY, startH: heightRef.current }

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return
        const delta = dragRef.current.startY - ev.clientY
        dispatch({
          type: 'SET_ANALYTICS_HEIGHT',
          height: dragRef.current.startH + delta,
        })
      }

      const onUp = () => {
        dragRef.current = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [dispatch],
  )

  const hasActiveLayer =
    state.layers.complaints ||
    state.layers.transit ||
    state.layers.vacancy ||
    state.layers.foodAccess

  const showNeighborhood = state.selected?.type === 'neighborhood'

  const modules = [
    state.layers.complaints ? <ComplaintsAnalytics key="complaints" /> : null,
    state.layers.transit ? <TransitAnalytics key="transit" /> : null,
    state.layers.vacancy ? <VacancyAnalytics key="vacancy" /> : null,
  ].filter(Boolean)

  return (
    <Collapsible
      open={state.analyticsPanelExpanded}
      onOpenChange={() => dispatch({ type: 'TOGGLE_ANALYTICS' })}
      className="bg-card"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between border-b border-border/60 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent/50">
        <span className="uppercase tracking-widest">Analytics</span>
        <span className="text-[0.6rem]">
          {state.analyticsPanelExpanded ? 'Collapse' : 'Expand'}
        </span>
      </CollapsibleTrigger>

      {/* Collapsed KPI strip */}
      {!state.analyticsPanelExpanded && (
        <div className="flex gap-4 overflow-x-auto px-4 py-2">
          {state.layers.complaints && data.csbData && (
            <KpiChip
              label="311 Requests"
              value={data.csbData.totalRequests.toLocaleString()}
            />
          )}
          {state.layers.transit && data.stops && (
            <KpiChip
              label="Transit Stops"
              value={data.stops.features.length.toLocaleString()}
            />
          )}
          {state.layers.vacancy && data.vacancyData && (
            <KpiChip
              label="Vacant Properties"
              value={data.vacancyData.length.toLocaleString()}
            />
          )}
          {state.layers.foodAccess && data.foodDeserts && (
            <KpiChip
              label="LILA Tracts"
              value={String(
                data.foodDeserts.features.filter(
                  (f) => (f.properties as { lila?: boolean }).lila,
                ).length,
              )}
            />
          )}
        </div>
      )}

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-[collapse-up_200ms_ease-out] data-[state=open]:animate-[collapse-down_250ms_ease-out]">
        {/* Drag handle */}
        <div
          onMouseDown={onDragStart}
          className="group flex h-1.5 cursor-row-resize items-center justify-center border-b border-border/40 hover:bg-accent/30"
        >
          <div className="h-0.5 w-8 rounded-full bg-muted-foreground/30 transition-colors group-hover:bg-muted-foreground/60" />
        </div>

        <div
          className="overflow-y-auto px-4 py-3"
          style={{ height: state.analyticsPanelHeight }}
        >
          {showNeighborhood ? (
            <NeighborhoodAnalytics
              id={(state.selected as { type: 'neighborhood'; id: string }).id}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {hasActiveLayer && modules.length > 0 && (
                modules.length === 1 ? (
                  modules[0]
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {modules}
                  </div>
                )
              )}
              <ChartBuilder />
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function KpiChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
      <span className="text-[0.6rem] text-muted-foreground">{label}</span>
      <span className="text-xs font-bold">{value}</span>
    </div>
  )
}
