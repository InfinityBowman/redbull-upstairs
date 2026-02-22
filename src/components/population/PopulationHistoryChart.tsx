import { useState, useMemo } from 'react'
import {
  stLouisPopulationHistory,
  getPopulationStats,
  type PopulationRecord,
} from '@/lib/population-history'
import { cn } from '@/lib/utils'

type TimeRange = 'all' | '1900+' | '1950+' | '1980+' | '2000+'

export function PopulationHistoryChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [hoveredYear, setHoveredYear] = useState<PopulationRecord | null>(null)
  const [showAnnotations, setShowAnnotations] = useState(true)

  const stats = useMemo(() => getPopulationStats(), [])

  const filteredData = useMemo(() => {
    const thresholds: Record<TimeRange, number> = {
      all: 0,
      '1900+': 1900,
      '1950+': 1950,
      '1980+': 1980,
      '2000+': 2000,
    }
    return stLouisPopulationHistory.filter(
      (p) => p.year >= thresholds[timeRange],
    )
  }, [timeRange])

  const maxPop = useMemo(
    () => Math.max(...filteredData.map((p) => p.population)),
    [filteredData],
  )
  const minPop = useMemo(
    () => Math.min(...filteredData.map((p) => p.population)),
    [filteredData],
  )

  const chartWidth = 100
  const chartHeight = 200

  const getPathD = () => {
    if (filteredData.length < 2) return ''
    return filteredData
      .map((p, i) => {
        const x = (i / (filteredData.length - 1)) * chartWidth
        const y =
          chartHeight -
          ((p.population - minPop) / (maxPop - minPop)) * chartHeight
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }

  const getAreaD = () => {
    const pathD = getPathD()
    if (!pathD) return ''
    return `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`
  }

  const annotations = [
    { year: 1930, label: 'Peak: 821,960', y: 10 },
    { year: 1980, label: '-27% decline', y: 60 },
    { year: 2024, label: '291,500', y: 90 },
  ]

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold">Population History</h3>
          <p className="text-[0.65rem] text-muted-foreground">
            St. Louis City population since {filteredData[0]?.year || 1810}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {(['all', '1900+', '1950+', '1980+', '2000+'] as TimeRange[]).map(
            (range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'rounded px-2 py-0.5 text-[0.6rem] font-medium transition-colors',
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {range === 'all' ? 'All' : range}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="relative" onMouseLeave={() => setHoveredYear(null)}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
          className="w-full h-56"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="popGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="rgb(99, 102, 241)"
                stopOpacity="0.4"
              />
              <stop
                offset="100%"
                stopColor="rgb(99, 102, 241)"
                stopOpacity="0.05"
              />
            </linearGradient>
          </defs>

          <path d={getAreaD()} fill="url(#popGradient)" />
          <path
            d={getPathD()}
            fill="none"
            stroke="rgb(99, 102, 241)"
            strokeWidth="0.5"
          />

          {showAnnotations &&
            timeRange === 'all' &&
            annotations.map((ann) => {
              const idx = stLouisPopulationHistory.findIndex(
                (p) => p.year === ann.year,
              )
              if (idx === -1) return null
              const dataPoint = stLouisPopulationHistory[idx]
              const x =
                (filteredData.findIndex((p) => p.year === ann.year) /
                  (filteredData.length - 1)) *
                chartWidth
              const y =
                chartHeight -
                ((dataPoint.population - minPop) / (maxPop - minPop)) *
                  chartHeight
              return (
                <g key={ann.year}>
                  <circle cx={x} cy={y} r="1" fill="rgb(99, 102, 241)" />
                  <text
                    x={x}
                    y={ann.y}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    style={{ fontSize: '3px' }}
                  >
                    {ann.label}
                  </text>
                </g>
              )
            })}

          {filteredData.map((p, i) => {
            const x = (i / (filteredData.length - 1)) * chartWidth
            const y =
              chartHeight -
              ((p.population - minPop) / (maxPop - minPop)) * chartHeight
            return (
              <circle
                key={p.year}
                cx={x}
                cy={y}
                r={hoveredYear?.year === p.year ? 1.5 : 0}
                fill="rgb(99, 102, 241)"
                className="transition-all"
              />
            )
          })}
        </svg>

        <div
          className="absolute inset-0"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = (e.clientX - rect.left) / rect.width
            const idx = Math.round(x * (filteredData.length - 1))
            if (idx >= 0 && idx < filteredData.length) {
              setHoveredYear(filteredData[idx])
            }
          }}
        />
      </div>

      {hoveredYear && (
        <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">{hoveredYear.year}</span>
            <span className="text-lg font-extrabold text-primary">
              {hoveredYear.population.toLocaleString()}
            </span>
          </div>
          {hoveredYear.change && (
            <div className="mt-1 flex items-center justify-between text-[0.65rem]">
              <span className="text-muted-foreground">
                {hoveredYear.change > 0 ? 'Increase' : 'Decline'}
              </span>
              <span
                className={cn(
                  'font-semibold',
                  hoveredYear.change > 0 ? 'text-emerald-500' : 'text-red-500',
                )}
              >
                {hoveredYear.change > 0 ? '+' : ''}
                {hoveredYear.change.toLocaleString()} (
                {hoveredYear.changePercent?.toFixed(1)}%)
              </span>
            </div>
          )}
          {hoveredYear.note && (
            <div className="mt-1 text-[0.6rem] text-muted-foreground italic">
              {hoveredYear.note}
            </div>
          )}
          {hoveredYear.rank && (
            <div className="text-[0.6rem] text-muted-foreground">
              US City Rank: #{hoveredYear.rank}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
          <div className="text-xs font-bold text-emerald-400">
            {stats.peak.population.toLocaleString()}
          </div>
          <div className="text-[0.5rem] text-muted-foreground">
            Peak ({stats.peak.year})
          </div>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-center">
          <div className="text-xs font-bold text-primary">
            {stats.current.population.toLocaleString()}
          </div>
          <div className="text-[0.5rem] text-muted-foreground">Current</div>
        </div>
        <div className="rounded-lg bg-red-500/10 p-2 text-center">
          <div className="text-xs font-bold text-red-400">
            -{stats.declinePercent}%
          </div>
          <div className="text-[0.5rem] text-muted-foreground">From Peak</div>
        </div>
        <div className="rounded-lg bg-orange-500/10 p-2 text-center">
          <div className="text-xs font-bold text-orange-400">
            {stats.yearsSincePeak}
          </div>
          <div className="text-[0.5rem] text-muted-foreground">
            Years Declining
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setShowAnnotations(!showAnnotations)}
          className={cn(
            'rounded px-2 py-0.5 text-[0.6rem] font-medium transition-colors',
            showAnnotations
              ? 'bg-muted text-foreground'
              : 'bg-muted/50 text-muted-foreground',
          )}
        >
          Annotations
        </button>
        <span className="text-[0.55rem] text-muted-foreground">
          Hover over chart for details
        </span>
      </div>
    </div>
  )
}
