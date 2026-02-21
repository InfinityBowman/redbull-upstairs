import { useMemo } from 'react'
import { useData, useExplorer } from '@/components/explorer/ExplorerProvider'
import {
  getDataset,
  getDatasetFields,
  getGroupedDatasets,
} from '@/lib/chart-datasets'
import { useChartBuilder } from './chart-builder/useChartBuilder'
import { ChartControls } from './chart-builder/ChartControls'
import { ChartCanvas } from './chart-builder/ChartCanvas'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ChartBuilder() {
  const { state: explorerState } = useExplorer()
  const data = useData()
  const [state, dispatch] = useChartBuilder()

  const grouped = useMemo(() => getGroupedDatasets(), [])

  const currentDef = state.datasetKey ? getDataset(state.datasetKey) : null

  const allFields = useMemo(
    () => (currentDef ? getDatasetFields(currentDef, data) : []),
    [currentDef, data],
  )

  const chartData = useMemo(
    () => currentDef?.extract(data) ?? null,
    [currentDef, data],
  )

  // Check if required layers are enabled
  const missingLayers = useMemo(() => {
    if (!currentDef) return []
    return currentDef.requiredLayers.filter((l) => !explorerState.layers[l])
  }, [currentDef, explorerState.layers])

  const handleDatasetChange = (key: string) => {
    const def = getDataset(key)
    if (!def) return
    const fields = getDatasetFields(def, data)
    dispatch({ type: 'SET_DATASET', datasetKey: key, fields })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-emerald-400">
          Custom Chart
        </span>

        <Select value={state.datasetKey} onValueChange={handleDatasetChange}>
          <SelectTrigger size="sm" className="min-w-[180px]">
            <SelectValue placeholder="Select dataset..." />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(grouped).map(([group, datasets]) => (
              <SelectGroup key={group}>
                <SelectLabel>{group}</SelectLabel>
                {datasets.map((d) => (
                  <SelectItem key={d.key} value={d.key}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentDef && missingLayers.length > 0 && (
        <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Enable the{' '}
          <span className="font-semibold text-foreground">
            {missingLayers.join(', ')}
          </span>{' '}
          layer to load this dataset
        </div>
      )}

      {currentDef && missingLayers.length === 0 && (
        <>
          {chartData ? (
            <>
              <ChartControls
                xAxisField={state.xAxisField}
                series={state.series}
                allFields={allFields}
                onSetXAxis={(field) =>
                  dispatch({ type: 'SET_X_AXIS', field })
                }
                onAddSeries={(field) =>
                  dispatch({ type: 'ADD_SERIES', field })
                }
                onRemoveSeries={(id) =>
                  dispatch({ type: 'REMOVE_SERIES', id })
                }
                onUpdateSeries={(id, changes) =>
                  dispatch({ type: 'UPDATE_SERIES', id, changes })
                }
              />
              <ChartCanvas
                data={chartData}
                xAxisField={state.xAxisField}
                series={state.series}
              />
            </>
          ) : (
            <div className="text-xs text-muted-foreground">
              Loading data...
            </div>
          )}
        </>
      )}
    </div>
  )
}
