import { useExplorer } from './ExplorerProvider'
import { NeighborhoodDetail } from './detail/NeighborhoodDetail'
import { VacancyDetail } from './detail/VacancyDetail'
import { StopDetail } from './detail/StopDetail'
import { GroceryDetail } from './detail/GroceryDetail'
import { FoodDesertDetail } from './detail/FoodDesertDetail'
import { NeighborhoodComparePanel } from './detail/NeighborhoodComparePanel'
import { Switch } from '@/components/ui/switch'

export function DetailPanel() {
  const { state, dispatch } = useExplorer()

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">Compare Neighborhoods</span>
          <Switch
            checked={state.compareMode}
            onCheckedChange={() => dispatch({ type: 'TOGGLE_COMPARE_MODE' })}
          />
        </div>
      </div>

      {state.compareMode ? (
        <div className="flex-1 overflow-y-auto">
          <NeighborhoodComparePanel
            neighborhoodA={state.compareNeighborhoodA}
            neighborhoodB={state.compareNeighborhoodB}
          />
        </div>
      ) : state.selected ? (
        <>
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
              {state.selected.type === 'neighborhood' && 'Neighborhood'}
              {state.selected.type === 'vacancy' && 'Property'}
              {state.selected.type === 'stop' && 'Transit Stop'}
              {state.selected.type === 'grocery' && 'Grocery Store'}
              {state.selected.type === 'foodDesert' && 'Food Desert Tract'}
            </span>
            <button
              onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
              className="rounded-md px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {state.selected.type === 'neighborhood' && (
              <NeighborhoodDetail id={state.selected.id} />
            )}
            {state.selected.type === 'vacancy' && (
              <VacancyDetail id={state.selected.id} />
            )}
            {state.selected.type === 'stop' && (
              <StopDetail id={state.selected.id} />
            )}
            {state.selected.type === 'grocery' && (
              <GroceryDetail id={state.selected.id} />
            )}
            {state.selected.type === 'foodDesert' && (
              <FoodDesertDetail id={state.selected.id} />
            )}
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center p-6 text-xs text-muted-foreground">
          Click an entity on the map to view details
        </div>
      )}
    </div>
  )
}
