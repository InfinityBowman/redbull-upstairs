import { useReducer } from 'react'
import { CATEGORY_COLORS } from '@/lib/colors'
import type { FieldDef } from '@/lib/chart-datasets'

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
}

type ChartBuilderAction =
  | { type: 'SET_DATASET'; datasetKey: string; fields: FieldDef[] }
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

function autoSelect(fields: FieldDef[]): {
  xAxisField: string
  series: SeriesConfig[]
} {
  const xField =
    fields.find((f) => f.type === 'date' || f.type === 'category') ?? fields[0]
  const firstNumeric = fields.find(
    (f) => f.type === 'number' && f.key !== xField?.key,
  )

  const series: SeriesConfig[] = firstNumeric
    ? [
        {
          id: uid(),
          fieldKey: firstNumeric.key,
          label: firstNumeric.label,
          chartType: 'bar',
          yAxisId: 'left',
          color: CATEGORY_COLORS[0],
        },
      ]
    : []

  return { xAxisField: xField?.key ?? '', series }
}

function reducer(
  state: ChartBuilderState,
  action: ChartBuilderAction,
): ChartBuilderState {
  switch (action.type) {
    case 'SET_DATASET': {
      const { xAxisField, series } = autoSelect(action.fields)
      return { datasetKey: action.datasetKey, xAxisField, series }
    }
    case 'SET_X_AXIS':
      return { ...state, xAxisField: action.field }
    case 'ADD_SERIES':
      return {
        ...state,
        series: [
          ...state.series,
          {
            id: uid(),
            fieldKey: action.field.key,
            label: action.field.label,
            chartType: 'bar',
            yAxisId: 'left',
            color: pickColor(state.series),
          },
        ],
      }
    case 'REMOVE_SERIES':
      return {
        ...state,
        series: state.series.filter((s) => s.id !== action.id),
      }
    case 'UPDATE_SERIES':
      return {
        ...state,
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
}

export function useChartBuilder() {
  return useReducer(reducer, initialState)
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
