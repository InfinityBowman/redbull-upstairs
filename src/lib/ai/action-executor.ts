import { resolveNeighborhood } from './neighborhood-resolver'
import type { ToolCall } from './use-chat'
import type { ChartBuilderAction } from '@/components/explorer/analytics/chart-builder/useChartBuilder'
import type { ExplorerAction, ExplorerData, ExplorerState, LayerToggles, SubToggles } from '@/lib/explorer-types'
import { getDataset, getDatasetFields } from '@/lib/chart-datasets'

interface ExecutorContext {
  state: ExplorerState
  dispatch: React.Dispatch<ExplorerAction>
  chartDispatch: React.Dispatch<ChartBuilderAction>
  data: ExplorerData
}

export interface ActionResult {
  description: string
}

export function executeToolCall(
  toolCall: ToolCall,
  ctx: ExecutorContext,
): ActionResult {
  const { state, dispatch, chartDispatch, data } = ctx
  const args = toolCall.arguments

  switch (toolCall.name) {
    case 'set_layers': {
      const layers = args.layers as Partial<Record<keyof LayerToggles, boolean>> | undefined
      if (!layers) return { description: 'No layers specified' }
      const toggled: Array<string> = []
      for (const [key, desired] of Object.entries(layers)) {
        const layerKey = key as keyof LayerToggles
        if (layerKey in state.layers && state.layers[layerKey] !== desired) {
          dispatch({ type: 'TOGGLE_LAYER', layer: layerKey })
          toggled.push(`${desired ? 'Enabled' : 'Disabled'} ${key}`)
        }
      }
      return {
        description: toggled.length ? toggled.join(', ') : 'Layers already set',
      }
    }

    case 'set_filters': {
      const filterMap: Array<[string, keyof SubToggles]> = [
        ['complaintsCategory', 'complaintsCategory'],
        ['complaintsMode', 'complaintsMode'],
        ['crimeCategory', 'crimeCategory'],
        ['crimeMode', 'crimeMode'],
        ['demographicsMetric', 'demographicsMetric'],
        ['arpaCategory', 'arpaCategory'],
      ]
      const set: Array<string> = []
      for (const [argKey, toggleKey] of filterMap) {
        if (argKey in args) {
          dispatch({
            type: 'SET_SUB_TOGGLE',
            key: toggleKey,
            value: args[argKey] as string,
          })
          set.push(`${toggleKey} = ${args[argKey]}`)
        }
      }
      return {
        description: set.length ? `Set filters: ${set.join(', ')}` : 'No filters changed',
      }
    }

    case 'select_neighborhood': {
      const name = args.name as string
      if (!name || !data.neighborhoods) {
        return { description: 'Could not find neighborhood' }
      }
      const resolved = resolveNeighborhood(name, data.neighborhoods)
      if (!resolved) {
        return { description: `No match for "${name}"` }
      }
      dispatch({
        type: 'SELECT_ENTITY',
        entity: { type: 'neighborhood', id: resolved.nhdNum },
      })
      return { description: `Selected ${resolved.name}` }
    }

    case 'select_entity': {
      const entityType = args.type as string
      const entityId = args.id as string
      if (entityType === 'stop') {
        dispatch({
          type: 'SELECT_ENTITY',
          entity: { type: 'stop', id: entityId },
        })
      } else if (entityType === 'grocery') {
        dispatch({
          type: 'SELECT_ENTITY',
          entity: { type: 'grocery', id: Number(entityId) },
        })
      } else if (entityType === 'foodDesert') {
        dispatch({
          type: 'SELECT_ENTITY',
          entity: { type: 'foodDesert', id: entityId },
        })
      }
      return { description: `Selected ${entityType} ${entityId}` }
    }

    case 'toggle_analytics': {
      const expanded = args.expanded as boolean
      if (state.analyticsPanelExpanded !== expanded) {
        dispatch({ type: 'TOGGLE_ANALYTICS' })
      }
      return {
        description: expanded ? 'Opened analytics panel' : 'Closed analytics panel',
      }
    }

    case 'configure_chart': {
      const datasetKey = args.datasetKey as string
      const presetName = args.presetName as string | undefined

      const def = getDataset(datasetKey)
      if (!def) {
        return { description: `Unknown dataset: ${datasetKey}` }
      }

      // Ensure required layers are on
      for (const layer of def.requiredLayers) {
        if (!state.layers[layer]) {
          dispatch({ type: 'TOGGLE_LAYER', layer })
        }
      }

      // Open analytics if closed
      if (!state.analyticsPanelExpanded) {
        dispatch({ type: 'TOGGLE_ANALYTICS' })
      }

      const fields = getDatasetFields(def, data)
      chartDispatch({ type: 'SET_DATASET', datasetKey, fields, def })

      if (presetName && def.presets) {
        const preset = def.presets.find((p) => p.name === presetName)
        if (preset) {
          chartDispatch({ type: 'APPLY_PRESET', preset, fields })
        }
      }

      return {
        description: `Configured chart: ${def.label}${presetName ? ` (${presetName})` : ''}`,
      }
    }

    case 'clear_selection': {
      dispatch({ type: 'CLEAR_SELECTION' })
      return { description: 'Cleared selection' }
    }

    default:
      return { description: `Unknown tool: ${toolCall.name}` }
  }
}
