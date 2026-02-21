import { useData, useExplorer } from './ExplorerProvider'
import { ComplaintsAnalytics } from './analytics/ComplaintsAnalytics'
import { TransitAnalytics } from './analytics/TransitAnalytics'
import { VacancyAnalytics } from './analytics/VacancyAnalytics'
import { NeighborhoodAnalytics } from './analytics/NeighborhoodAnalytics'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export function AnalyticsPanel() {
  const { state, dispatch } = useExplorer()
  const data = useData()

  const hasActiveLayer =
    state.layers.complaints ||
    state.layers.transit ||
    state.layers.vacancy ||
    state.layers.foodAccess

  if (!hasActiveLayer) return null

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
        <div className="max-h-[440px] overflow-y-auto px-4 py-3">
          {showNeighborhood ? (
            <NeighborhoodAnalytics
              id={(state.selected as { type: 'neighborhood'; id: string }).id}
            />
          ) : modules.length === 1 ? (
            modules[0]
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {modules}
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
