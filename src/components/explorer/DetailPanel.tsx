import { useExplorer } from './ExplorerProvider'
import { NeighborhoodDetail } from './detail/NeighborhoodDetail'
import { VacancyDetail } from './detail/VacancyDetail'
import { StopDetail } from './detail/StopDetail'
import { GroceryDetail } from './detail/GroceryDetail'
import { FoodDesertDetail } from './detail/FoodDesertDetail'

export function DetailPanel() {
  const { state, dispatch } = useExplorer()

  if (!state.selected) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-xs text-muted-foreground">
        Click an entity on the map to view details
      </div>
    )
  }

  return (
    <div className="flex flex-col">
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
    </div>
  )
}
