import { useMemo } from 'react'
import { useData, useExplorer } from '@/components/explorer/ExplorerProvider'
import {
  getDataset,
  getDatasetFields,
  getGroupedDatasets,
  GROUP_DESCRIPTIONS,
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
  const { loadLayerData } = useExplorer()
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

  const handleDatasetChange = (key: string) => {
    const def = getDataset(key)
    if (!def) return
    // Ensure data is loaded for this dataset (safety net — prefetch usually handles it)
    def.requiredLayers.forEach((l) => loadLayerData(l))
    const fields = getDatasetFields(def, data)
    dispatch({ type: 'SET_DATASET', datasetKey: key, fields, def })
  }

  const handlePresetClick = (presetName: string) => {
    if (!currentDef?.presets) return
    const preset = currentDef.presets.find((p) => p.name === presetName)
    if (preset) {
      dispatch({ type: 'APPLY_PRESET', preset, fields: allFields })
    }
  }

  // Empty state — no dataset selected
  if (!state.datasetKey) {
    return (
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-foreground">
            Build a Chart
          </h3>
          <p className="text-xs text-muted-foreground">
            Pick a dataset to get started. Charts auto-configure with smart
            defaults, or customize axes and series to build exactly what you
            need.
          </p>
        </div>

        {/* Dataset grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(grouped).map(([group, datasets]) => (
            <div
              key={group}
              className="flex flex-col gap-2 rounded-lg border border-border/50 p-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">
                  {group}
                </span>
                {GROUP_DESCRIPTIONS[group] && (
                  <span className="text-[0.65rem] text-muted-foreground">
                    {GROUP_DESCRIPTIONS[group]}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {datasets.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => handleDatasetChange(d.key)}
                    className="rounded-md px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                  >
                    <span className="font-medium">{d.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Active state — dataset selected
  return (
    <div className="flex flex-col gap-4">
      {/* Header row: dataset selector + presets */}
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex flex-col gap-1">
          <Select
            value={state.datasetKey}
            onValueChange={handleDatasetChange}
          >
            <SelectTrigger size="sm" className="min-w-[200px]">
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
          {currentDef?.description && (
            <span className="text-[0.65rem] text-muted-foreground">
              {currentDef.description}
            </span>
          )}
        </div>

        {/* Preset buttons */}
        {currentDef?.presets && currentDef.presets.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Presets
            </span>
            {currentDef.presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetClick(preset.name)}
                className={`rounded-md px-2.5 py-1 text-[0.65rem] font-medium transition-colors ${
                  state.activePreset === preset.name
                    ? 'bg-accent text-accent-foreground'
                    : 'border border-border/60 text-muted-foreground hover:bg-accent/30 hover:text-foreground'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Controls + Chart */}
      {chartData ? (
        <div className="flex flex-col gap-4">
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
            title={currentDef?.label}
            height={300}
          />
        </div>
      ) : (
        <div className="flex h-[120px] items-center justify-center text-xs text-muted-foreground">
          Loading data...
        </div>
      )}
    </div>
  )
}
