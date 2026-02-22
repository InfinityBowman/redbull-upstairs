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

interface TimeSeriesChartProps {
  data: Array<{ date: string; value: number; ma7?: number | null }>
  barColor?: string
  lineColor?: string
  barLabel?: string
  lineLabel?: string
  height?: number
  dualAxis?: boolean
}

export function TimeSeriesChart({
  data,
  barColor = 'rgba(99,102,241,0.4)',
  lineColor = '#f59e0b',
  barLabel = 'Daily',
  lineLabel = '7-Day Avg',
  height = 350,
  dualAxis = false,
}: TimeSeriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="date"
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickFormatter={(v) => {
            const d = new Date(v)
            return d.toLocaleDateString('en-US', { month: 'short' })
          }}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <YAxis
          yAxisId="left"
          stroke="var(--color-muted-foreground)"
          fontSize={11}
        />
        {dualAxis && (
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke={lineColor}
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
          formatter={(v: number, name: string) => [v.toLocaleString(), name]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          yAxisId="left"
          dataKey="value"
          name={barLabel}
          fill={barColor}
          radius={[2, 2, 0, 0]}
        />
        <Line
          yAxisId={dualAxis ? 'right' : 'left'}
          dataKey="ma7"
          name={lineLabel}
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
