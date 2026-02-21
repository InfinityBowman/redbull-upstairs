import { ExplorerProvider, useExplorer } from './ExplorerProvider'
import { ExplorerMap } from './ExplorerMap'
import { LayerPanel } from './LayerPanel'
import { DetailPanel } from './DetailPanel'
import { AnalyticsPanel } from './AnalyticsPanel'
import { cn } from '@/lib/utils'

function ExplorerLayout() {
  const { state } = useExplorer()

  return (
    <div
      className={cn(
        'grid h-[calc(100vh-3.5rem-1px)] w-full transition-[grid-template-columns] duration-300',
        state.detailPanelOpen
          ? 'grid-cols-[280px_1fr_380px]'
          : 'grid-cols-[280px_1fr_0px]',
        'grid-rows-[1fr_auto]',
        'max-lg:grid-cols-1 max-lg:grid-rows-[auto_50vh_auto_auto]',
      )}
      style={{
        gridTemplateAreas: `
          "layers map detail"
          "analytics analytics analytics"
        `,
      }}
    >
      <div
        className="overflow-y-auto border-r border-border/60 max-lg:border-r-0 max-lg:border-b max-lg:border-border/60"
        style={{ gridArea: 'layers' }}
      >
        <LayerPanel />
      </div>

      <div className="relative min-h-0" style={{ gridArea: 'map' }}>
        <ExplorerMap />
      </div>

      <div
        className={cn(
          'overflow-y-auto transition-all duration-300 max-lg:border-l-0 max-lg:border-t max-lg:border-border/60',
          state.detailPanelOpen
            ? 'border-l border-border/60'
            : 'max-lg:hidden',
        )}
        style={{ gridArea: 'detail' }}
      >
        <DetailPanel />
      </div>

      <div
        className="border-t border-border/60"
        style={{ gridArea: 'analytics' }}
      >
        <AnalyticsPanel />
      </div>
    </div>
  )
}

export function MapExplorer() {
  return (
    <ExplorerProvider>
      <ExplorerLayout />
    </ExplorerProvider>
  )
}
