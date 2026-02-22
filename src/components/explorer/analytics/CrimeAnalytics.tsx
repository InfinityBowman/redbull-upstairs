import { useMemo } from 'react'
import { useData, useFailedDatasets } from '../ExplorerProvider'
import { MiniKpi } from './MiniKpi'
import { TimeSeriesChart } from '@/components/charts/TimeSeriesChart'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import { HourlyChart } from '@/components/charts/HourlyChart'
import { WeekdayChart } from '@/components/charts/WeekdayChart'
import { movingAverage } from '@/lib/analysis'

export function CrimeAnalytics() {
  const data = useData()
  const failed = useFailedDatasets()

  const kpis = useMemo(() => {
    if (!data.crimeData) return null
    const d = data.crimeData
    const days = Object.keys(d.dailyCounts).length || 365
    return {
      total: d.totalIncidents,
      perDay: Math.round(d.totalIncidents / days),
      felonies: d.totalFelonies,
      firearms: d.totalFirearms,
    }
  }, [data.crimeData])

  const dailyChart = useMemo(() => {
    if (!data.crimeData) return []
    const entries = Object.entries(data.crimeData.dailyCounts).sort()
    const values = entries.map((e) => e[1])
    const ma7 = movingAverage(values)
    return entries.map((e, i) => ({ date: e[0], value: e[1], ma7: ma7[i] }))
  }, [data.crimeData])

  const categoryChart = useMemo(
    () =>
      data.crimeData
        ? Object.entries(data.crimeData.categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([name, value]) => ({ name, value }))
        : [],
    [data.crimeData],
  )

  if (!data.crimeData || !kpis) {
    if (failed.has('crime')) {
      return (
        <div className="text-xs text-muted-foreground">Crime data unavailable.</div>
      )
    }
    return (
      <div className="text-xs text-muted-foreground">Loading crime data...</div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-2">
        <MiniKpi label="Total" value={kpis.total.toLocaleString()} />
        <MiniKpi label="Per Day" value={String(kpis.perDay)} />
        <MiniKpi label="Felonies" value={kpis.felonies.toLocaleString()} />
        <MiniKpi label="Firearm" value={kpis.firearms.toLocaleString()} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="h-[180px] overflow-hidden">
          <TimeSeriesChart
            data={dailyChart}
            barLabel="Daily"
            lineLabel="7d Avg"
            height={180}
          />
        </div>
        <div className="h-[180px] overflow-hidden">
          <CategoryBarChart data={categoryChart} horizontal height={180} valueLabel="Incidents" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="overflow-hidden">
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            By Hour
          </div>
          <HourlyChart data={data.crimeData.hourly} height={160} valueLabel="Incidents" />
        </div>
        <div className="overflow-hidden">
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            By Day
          </div>
          <WeekdayChart weekday={data.crimeData.weekday} height={160} valueLabel="Incidents" />
        </div>
      </div>
    </div>
  )
}

