import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import { HourlyChart } from '@/components/charts/HourlyChart'
import { WeekdayChart } from '@/components/charts/WeekdayChart'
import { WeatherInsights } from '@/components/charts/WeatherInsights'
import { computeKPIs, movingAverage, weatherInsights } from '@/lib/analysis'

export function ComplaintsAnalytics() {
  const data = useData()

  const kpis = useMemo(
    () => (data.csbData ? computeKPIs(data.csbData) : null),
    [data.csbData],
  )

  const weather = useMemo(
    () =>
      data.csbData && data.trendsData
        ? weatherInsights(data.csbData.dailyCounts, data.trendsData.weather)
        : null,
    [data.csbData, data.trendsData],
  )

  const dailyChart = useMemo(() => {
    if (!data.csbData) return []
    const entries = Object.entries(data.csbData.dailyCounts).sort()
    const values = entries.map((e) => e[1])
    const ma7 = movingAverage(values)
    return entries.map((e, i) => ({ date: e[0], value: e[1], ma7: ma7[i] }))
  }, [data.csbData])

  const categoryChart = useMemo(
    () =>
      data.csbData
        ? Object.entries(data.csbData.categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([name, value]) => ({ name, value }))
        : [],
    [data.csbData],
  )

  if (!data.csbData || !kpis) {
    return (
      <div className="text-xs text-muted-foreground">Loading 311 data...</div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-bold text-indigo-400">311 Complaints</div>

      {/* KPIs — 4 across */}
      <div className="grid grid-cols-4 gap-2">
        <MiniKpi label="Total" value={kpis.totalRequests.toLocaleString()} />
        <MiniKpi label="Closure" value={`${kpis.closedPct}%`} />
        <MiniKpi label="Avg Resolution" value={`${kpis.avgResolution}d`} />
        <MiniKpi label="Per Day" value={String(kpis.perDay)} />
      </div>

      {/* Main charts row — time series wider, categories narrower */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="h-[180px]">
          <TimeSeriesChart
            data={dailyChart}
            barLabel="Daily"
            lineLabel="7d Avg"
          />
        </div>
        <div className="h-[180px]">
          <CategoryBarChart data={categoryChart} horizontal />
        </div>
      </div>

      {/* Bottom row — hourly, weekday, weather side-by-side */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            By Hour
          </div>
          <HourlyChart data={data.csbData.hourly} height={160} />
        </div>
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            By Day
          </div>
          <WeekdayChart weekday={data.csbData.weekday} height={160} />
        </div>
        {weather && (
          <div>
            <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
              Weather Correlation
            </div>
            <WeatherInsights weather={weather} />
          </div>
        )}
      </div>
    </div>
  )
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted px-2.5 py-1.5">
      <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  )
}
