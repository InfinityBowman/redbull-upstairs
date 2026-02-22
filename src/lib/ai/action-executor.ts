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

/** Fuzzy-match a user/AI string against a list of known values (case-insensitive, substring) */
function fuzzyMatch(input: string, candidates: string[]): string | null {
  const lower = input.toLowerCase()
  // Exact match first
  const exact = candidates.find((c) => c.toLowerCase() === lower)
  if (exact) return exact
  // Substring match (input contained in candidate)
  const substring = candidates.find((c) => c.toLowerCase().includes(lower))
  if (substring) return substring
  // Reverse substring (candidate contained in input)
  const reverse = candidates.find((c) => lower.includes(c.toLowerCase()))
  if (reverse) return reverse
  return null
}

/** Friendly label for filter values (title-case the raw data strings) */
function friendlyLabel(value: string): string {
  if (value === 'all') return 'All'
  if (value === 'choropleth') return 'Choropleth'
  if (value === 'heatmap') return 'Heatmap'
  if (value === 'population') return 'Population'
  if (value === 'vacancyRate') return 'Vacancy Rate'
  if (value === 'popChange') return 'Pop Change'
  // Title-case raw strings like "STEALING - MOTOR VEHICLE/..."
  return value
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\//g, ' / ')
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
        description: toggled.length ? toggled.join(', ') : '',
      }
    }

    case 'set_filters': {
      const descriptions: Array<string> = []

      // Helper: resolve a category filter with fuzzy matching
      const resolveCategory = (
        argKey: string,
        toggleKey: keyof SubToggles,
        candidates: string[],
        layerKey: keyof LayerToggles,
        label: string,
      ) => {
        if (!(argKey in args)) return
        const raw = args[argKey] as string
        if (raw === 'all') {
          dispatch({ type: 'SET_SUB_TOGGLE', key: toggleKey, value: 'all' })
          descriptions.push(`${label}: All`)
          return
        }
        const matched = fuzzyMatch(raw, candidates)
        if (matched) {
          // Auto-enable the layer if it's off
          if (!state.layers[layerKey]) {
            dispatch({ type: 'TOGGLE_LAYER', layer: layerKey })
          }
          dispatch({ type: 'SET_SUB_TOGGLE', key: toggleKey, value: matched })
          descriptions.push(`${label}: ${friendlyLabel(matched)}`)
        } else {
          descriptions.push(`${label}: no match for "${raw}"`)
        }
      }

      // Helper: set a simple enum filter
      const setEnum = (
        argKey: string,
        toggleKey: keyof SubToggles,
        valid: string[],
        layerKey: keyof LayerToggles,
        label: string,
      ) => {
        if (!(argKey in args)) return
        const raw = args[argKey] as string
        const matched = valid.find((v) => v.toLowerCase() === raw.toLowerCase()) ?? valid[0]
        if (!state.layers[layerKey]) {
          dispatch({ type: 'TOGGLE_LAYER', layer: layerKey })
        }
        dispatch({ type: 'SET_SUB_TOGGLE', key: toggleKey, value: matched })
        descriptions.push(`${label}: ${friendlyLabel(matched)}`)
      }

      // Crime
      const crimeCategories = data.crimeData
        ? Object.keys(data.crimeData.categories)
        : []
      resolveCategory('crimeCategory', 'crimeCategory', crimeCategories, 'crime', 'Crime filter')
      setEnum('crimeMode', 'crimeMode', ['choropleth', 'heatmap'], 'crime', 'Crime view')

      // Complaints
      const complaintCategories = data.csbData
        ? Object.keys(data.csbData.categories)
        : []
      resolveCategory('complaintsCategory', 'complaintsCategory', complaintCategories, 'complaints', 'Complaints filter')
      setEnum('complaintsMode', 'complaintsMode', ['choropleth', 'heatmap'], 'complaints', 'Complaints view')

      // Demographics
      setEnum('demographicsMetric', 'demographicsMetric', ['population', 'vacancyRate', 'popChange'], 'demographics', 'Demographics')

      // ARPA
      const arpaCategories = data.arpaData
        ? Object.keys(data.arpaData.categoryBreakdown)
        : []
      resolveCategory('arpaCategory', 'arpaCategory', arpaCategories, 'arpa', 'ARPA filter')

      return {
        description: descriptions.length ? descriptions.join(', ') : '',
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
