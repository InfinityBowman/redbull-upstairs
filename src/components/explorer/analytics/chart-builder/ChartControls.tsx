import { useState } from 'react'
import type { FieldDef } from '@/lib/chart-datasets'
import type { ChartType, SeriesConfig } from './useChartBuilder'
import { getAvailableYFields } from './useChartBuilder'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ChartControlsProps {
  xAxisField: string
  series: SeriesConfig[]
  allFields: FieldDef[]
  onSetXAxis: (field: string) => void
  onAddSeries: (field: FieldDef) => void
  onRemoveSeries: (id: string) => void
  onUpdateSeries: (id: string, changes: Partial<SeriesConfig>) => void
}

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'scatter', label: 'Dot' },
]

export function ChartControls({
  xAxisField,
  series,
  allFields,
  onSetXAxis,
  onAddSeries,
  onRemoveSeries,
  onUpdateSeries,
}: ChartControlsProps) {
  const [addKey, setAddKey] = useState(0)

  const xOptions = allFields.filter(
    (f) => f.type === 'category' || f.type === 'date',
  )
  const xChoices = xOptions.length > 0 ? xOptions : allFields

  const availableY = getAvailableYFields(allFields, xAxisField, series)

  return (
    <div className="flex flex-col gap-3">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* X Axis */}
        <div className="flex items-center gap-2">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            X Axis
          </span>
          <Select value={xAxisField} onValueChange={onSetXAxis}>
            <SelectTrigger size="sm" className="min-w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {xChoices.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add Series button */}
        {availableY.length > 0 && (
          <div className="flex items-center gap-2">
            <Select
              key={addKey}
              onValueChange={(key) => {
                const field = allFields.find((f) => f.key === key)
                if (field) {
                  onAddSeries(field)
                  setAddKey((k) => k + 1)
                }
              }}
            >
              <SelectTrigger
                size="sm"
                className="min-w-[140px] border-dashed text-muted-foreground hover:border-solid hover:text-foreground"
              >
                <SelectValue placeholder="+ Add series" />
              </SelectTrigger>
              <SelectContent>
                {availableY.map((f) => (
                  <SelectItem key={f.key} value={f.key}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Series list */}
      {series.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {series.map((s) => (
            <SeriesRow
              key={s.id}
              series={s}
              onUpdate={(changes) => onUpdateSeries(s.id, changes)}
              onRemove={() => onRemoveSeries(s.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SeriesRow({
  series,
  onUpdate,
  onRemove,
}: {
  series: SeriesConfig
  onUpdate: (changes: Partial<SeriesConfig>) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-md bg-muted/30 px-2.5 py-1.5">
      {/* Color dot */}
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: series.color }}
      />

      {/* Field label */}
      <span className="min-w-[80px] truncate text-xs font-medium">
        {series.label}
      </span>

      {/* Chart type toggles */}
      <div className="flex overflow-hidden rounded-md border border-border/60">
        {CHART_TYPES.map((ct) => (
          <button
            key={ct.value}
            onClick={() => onUpdate({ chartType: ct.value })}
            className={`px-2 py-0.5 text-[0.65rem] font-medium transition-colors ${
              series.chartType === ct.value
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/30'
            }`}
          >
            {ct.label}
          </button>
        ))}
      </div>

      {/* Axis side toggle */}
      <div className="flex overflow-hidden rounded-md border border-border/60">
        <button
          onClick={() => onUpdate({ yAxisId: 'left' })}
          className={`px-2 py-0.5 text-[0.65rem] font-medium transition-colors ${
            series.yAxisId === 'left'
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/30'
          }`}
        >
          Left
        </button>
        <button
          onClick={() => onUpdate({ yAxisId: 'right' })}
          className={`px-2 py-0.5 text-[0.65rem] font-medium transition-colors ${
            series.yAxisId === 'right'
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/30'
          }`}
        >
          Right
        </button>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="ml-auto rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        Remove
      </button>
    </div>
  )
}
