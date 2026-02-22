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
  title?: string
  height?: number
}

export function ChartCanvas({
  data,
  xAxisField,
  series,
  title,
  height = 280,
}: ChartCanvasProps) {
  if (data.length === 0 || series.length === 0) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 text-muted-foreground">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-40"
        >
          <path d="M3 3v18h18" />
          <path d="M7 16l4-8 4 4 6-10" />
        </svg>
        <span className="text-xs">Add a series to start charting</span>
      </div>
    )
  }

  const hasRightAxis = series.some((s) => s.yAxisId === 'right')

  return (
    <div className="flex flex-col gap-2">
      {title && (
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      )}
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
    </div>
  )
}
