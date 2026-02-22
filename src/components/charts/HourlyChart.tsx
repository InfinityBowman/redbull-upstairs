import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface HourlyChartProps {
  data: Record<string, number>
  height?: number
  valueLabel?: string
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
})

export function HourlyChart({ data, height = 300, valueLabel = 'Incidents' }: HourlyChartProps) {
  const max = Math.max(...Object.values(data), 1)
  const chartData = Array.from({ length: 24 }, (_, h) => ({
    hour: HOUR_LABELS[h],
    value: data[String(h)] || 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="hour"
          stroke="var(--color-muted-foreground)"
          fontSize={10}
          interval={2}
        />
        <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
        <Tooltip
          contentStyle={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--color-foreground)',
          }}
          formatter={(v: number) => [v.toLocaleString(), valueLabel]}
        />
        <Bar dataKey="value" name={valueLabel} radius={[4, 4, 0, 0]}>
          {chartData.map((d, i) => {
            const ratio = d.value / max
            const fill =
              ratio > 0.8
                ? '#ef4444aa'
                : ratio > 0.5
                  ? '#f59e0baa'
                  : '#4f6ef7aa'
            return <Cell key={i} fill={fill} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
