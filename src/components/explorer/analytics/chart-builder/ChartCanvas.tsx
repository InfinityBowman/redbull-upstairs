import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SeriesConfig } from './useChartBuilder'

interface ChartCanvasProps {
  data: Record<string, string | number>[]
  xAxisField: string
  series: SeriesConfig[]
  height?: number
}

export function ChartCanvas({
  data,
  xAxisField,
  series,
  height = 200,
}: ChartCanvasProps) {
  if (data.length === 0 || series.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
        Select a dataset and add series to begin
      </div>
    )
  }

  const hasRightAxis = series.some((s) => s.yAxisId === 'right')

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey={xAxisField}
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          interval="preserveStartEnd"
          minTickGap={30}
        />
        <YAxis
          yAxisId="left"
          stroke="var(--color-muted-foreground)"
          fontSize={11}
        />
        {hasRightAxis && (
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="var(--color-muted-foreground)"
            fontSize={11}
          />
        )}
        <Tooltip
          contentStyle={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--color-foreground)',
          }}
          labelStyle={{ color: 'var(--color-foreground)' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />

        {series.map((s) => {
          const yAxisId = hasRightAxis ? s.yAxisId : 'left'
          switch (s.chartType) {
            case 'bar':
              return (
                <Bar
                  key={s.id}
                  dataKey={s.fieldKey}
                  name={s.label}
                  fill={s.color + '99'}
                  yAxisId={yAxisId}
                  radius={[2, 2, 0, 0]}
                />
              )
            case 'line':
              return (
                <Line
                  key={s.id}
                  dataKey={s.fieldKey}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  yAxisId={yAxisId}
                />
              )
            case 'scatter':
              return (
                <Line
                  key={s.id}
                  dataKey={s.fieldKey}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={0}
                  dot={{ r: 3, fill: s.color }}
                  activeDot={{ r: 5 }}
                  yAxisId={yAxisId}
                />
              )
          }
        })}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
