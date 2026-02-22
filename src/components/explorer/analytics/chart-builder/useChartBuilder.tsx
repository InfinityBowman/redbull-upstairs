import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import { CATEGORY_COLORS } from '@/lib/colors'
import type { DatasetDef, FieldDef, PresetConfig } from '@/lib/chart-datasets'

export type ChartType = 'bar' | 'line' | 'scatter'

export interface SeriesConfig {
  id: string
  fieldKey: string
  label: string
  chartType: ChartType
  yAxisId: 'left' | 'right'
  color: string
}

export interface ChartBuilderState {
  datasetKey: string
  xAxisField: string
  series: SeriesConfig[]
  activePreset: string | null
}

export type ChartBuilderAction =
  | { type: 'SET_DATASET'; datasetKey: string; fields: FieldDef[]; def: DatasetDef }
  | { type: 'APPLY_PRESET'; preset: PresetConfig; fields: FieldDef[] }
  | { type: 'SET_X_AXIS'; field: string }
  | { type: 'ADD_SERIES'; field: FieldDef }
  | { type: 'REMOVE_SERIES'; id: string }
  | { type: 'UPDATE_SERIES'; id: string; changes: Partial<SeriesConfig> }

function uid() {
  return `s${Math.random().toString(36).slice(2, 9)}`
}

function pickColor(existing: SeriesConfig[]): string {
  const usedColors = new Set(existing.map((s) => s.color))
  return (
    CATEGORY_COLORS.find((c) => !usedColors.has(c)) ?? CATEGORY_COLORS[0]
  )
}

function smartChartType(field: FieldDef, xField: FieldDef | undefined): ChartType {
  if (xField?.type === 'date') return 'line'
  if (xField?.type === 'category') return 'bar'
  return 'bar'
}

function buildSeriesFromPreset(
  preset: PresetConfig,
  fields: FieldDef[],
): { xAxisField: string; series: SeriesConfig[] } {
  const series: SeriesConfig[] = []
  for (let i = 0; i < preset.series.length; i++) {
    const ps = preset.series[i]
    const fieldDef = fields.find((f) => f.key === ps.fieldKey)
    if (!fieldDef) continue
    series.push({
      id: uid(),
      fieldKey: ps.fieldKey,
      label: fieldDef.label,
      chartType: ps.chartType,
      yAxisId: ps.yAxisId ?? 'left',
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    })
  }
  return { xAxisField: preset.xAxisField, series }
}

function autoSelect(
  fields: FieldDef[],
  def?: DatasetDef,
): { xAxisField: string; series: SeriesConfig[]; activePreset: string | null } {
  // If preset available, use the first one
  if (def?.presets?.length) {
    const preset = def.presets[0]
    const { xAxisField, series } = buildSeriesFromPreset(preset, fields)
    return { xAxisField, series, activePreset: preset.name }
  }

  // Smart defaults based on field types
  const xField =
    fields.find((f) => f.type === 'date') ??
    fields.find((f) => f.type === 'category') ??
    fields[0]
  const firstNumeric = fields.find(
    (f) => f.type === 'number' && f.key !== xField?.key,
  )

  const series: SeriesConfig[] = firstNumeric
    ? [
        {
          id: uid(),
          fieldKey: firstNumeric.key,
          label: firstNumeric.label,
          chartType: smartChartType(firstNumeric, xField),
          yAxisId: 'left',
          color: CATEGORY_COLORS[0],
        },
      ]
    : []

  return { xAxisField: xField?.key ?? '', series, activePreset: null }
}

function reducer(
  state: ChartBuilderState,
  action: ChartBuilderAction,
): ChartBuilderState {
  switch (action.type) {
    case 'SET_DATASET': {
      const { xAxisField, series, activePreset } = autoSelect(action.fields, action.def)
      return { datasetKey: action.datasetKey, xAxisField, series, activePreset }
    }
    case 'APPLY_PRESET': {
      const { xAxisField, series } = buildSeriesFromPreset(
        action.preset,
        action.fields,
      )
      return {
        ...state,
        xAxisField,
        series,
        activePreset: action.preset.name,
      }
    }
    case 'SET_X_AXIS':
      return { ...state, xAxisField: action.field, activePreset: null }
    case 'ADD_SERIES': {
      const xField = undefined // We don't need it for the add case
      return {
        ...state,
        activePreset: null,
        series: [
          ...state.series,
          {
            id: uid(),
            fieldKey: action.field.key,
            label: action.field.label,
            chartType: smartChartType(action.field, xField),
            yAxisId: 'left',
            color: pickColor(state.series),
          },
        ],
      }
    }
    case 'REMOVE_SERIES':
      return {
        ...state,
        activePreset: null,
        series: state.series.filter((s) => s.id !== action.id),
      }
    case 'UPDATE_SERIES':
      return {
        ...state,
        activePreset: null,
        series: state.series.map((s) =>
          s.id === action.id ? { ...s, ...action.changes } : s,
        ),
      }
    default:
      return state
  }
}

const initialState: ChartBuilderState = {
  datasetKey: '',
  xAxisField: '',
  series: [],
  activePreset: null,
}

// ── Context ──────────────────────────────────────────────

const ChartBuilderContext = createContext<{
  state: ChartBuilderState
  dispatch: React.Dispatch<ChartBuilderAction>
} | null>(null)

export function ChartBuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <ChartBuilderContext.Provider value={{ state, dispatch }}>
      {children}
    </ChartBuilderContext.Provider>
  )
}

export function useChartBuilder(): [ChartBuilderState, React.Dispatch<ChartBuilderAction>] {
  const ctx = useContext(ChartBuilderContext)
  if (!ctx) throw new Error('useChartBuilder must be used within ChartBuilderProvider')
  return [ctx.state, ctx.dispatch]
}

export function getAvailableYFields(
  allFields: FieldDef[],
  xAxisField: string,
  existingSeries: SeriesConfig[],
): FieldDef[] {
  const usedKeys = new Set(existingSeries.map((s) => s.fieldKey))
  return allFields.filter(
    (f) => f.type === 'number' && f.key !== xAxisField && !usedKeys.has(f.key),
  )
}
