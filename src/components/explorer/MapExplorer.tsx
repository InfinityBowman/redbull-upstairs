import { ExplorerProvider, useExplorer } from './ExplorerProvider'
import { ChartBuilderProvider } from './analytics/chart-builder/useChartBuilder'
import { ExplorerMap } from './ExplorerMap'
import { LayerPanel } from './LayerPanel'
import { DetailPanel } from './DetailPanel'
import { AnalyticsPanel } from './AnalyticsPanel'
import { CommandBar } from './CommandBar'
import { cn } from '@/lib/utils'

function ExplorerLayout() {
  const { state } = useExplorer()

  return (
    <div
      className={cn(
        'grid h-full w-full',
        'grid-cols-[280px_1fr] grid-rows-[1fr_auto]',
        'max-lg:grid-cols-1 max-lg:grid-rows-[auto_50vh_auto_auto]',
      )}
      style={{
        gridTemplateAreas: `
          "layers map"
          "analytics analytics"
        `,
      }}
    >
      <div
        className="overlay-scroll overflow-y-auto border-r border-border/60 max-lg:border-r-0 max-lg:border-b max-lg:border-border/60"
        style={{ gridArea: 'layers' }}
      >
        <LayerPanel />
      </div>

      <div className="relative min-h-0 overflow-hidden" style={{ gridArea: 'map' }}>
        <ExplorerMap />

        {/* Detail panel — always mounted, slides via transform */}
        <div
          className={cn(
            'absolute inset-y-0 right-0 z-10 w-[380px] border-l border-border/60 bg-background shadow-lg transition-transform duration-150 ease-out will-change-transform',
            'max-lg:relative max-lg:inset-auto max-lg:w-full max-lg:border-l-0 max-lg:border-t max-lg:shadow-none',
            state.detailPanelOpen
              ? 'translate-x-0'
              : 'translate-x-full max-lg:hidden',
          )}
        >
          <DetailPanel />
        </div>
      </div>

      <div style={{ gridArea: 'analytics' }}>
        <AnalyticsPanel />
      </div>
    </div>
  )
}

export function MapExplorer() {
  return (
    <ExplorerProvider>
      <ChartBuilderProvider>
        <ExplorerLayout />
        <CommandBar />
      </ChartBuilderProvider>
    </ExplorerProvider>
  )
}
