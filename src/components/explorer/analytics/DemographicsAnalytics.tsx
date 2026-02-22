import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'

export function DemographicsAnalytics() {
  const data = useData()

  const kpis = useMemo(() => {
    if (!data.demographicsData) return null
    const hoods = Object.values(data.demographicsData)
    const totalPop = hoods.reduce((s, h) => s + (h.population['2020'] ?? 0), 0)
    const totalUnits = hoods.reduce((s, h) => s + h.housing.totalUnits, 0)
    const totalVacant = hoods.reduce((s, h) => s + h.housing.vacant, 0)
    const avgVacancy = totalUnits > 0 ? (totalVacant / totalUnits) * 100 : 0
    const popChanges = hoods.filter((h) => h.population['2010'] > 0)
    const avgPopChange =
      popChanges.length > 0
        ? popChanges.reduce((s, h) => s + h.popChange10to20, 0) / popChanges.length
        : 0

    return {
      population: totalPop,
      vacancyRate: avgVacancy.toFixed(1),
      avgPopChange: avgPopChange.toFixed(1),
      neighborhoods: hoods.length,
    }
  }, [data.demographicsData])

  const popChart = useMemo(() => {
    if (!data.demographicsData) return []
    return Object.entries(data.demographicsData)
      .map(([, h]) => ({
        name: h.name,
        value: h.population['2020'] ?? 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12)
  }, [data.demographicsData])

  const popChangeChart = useMemo(() => {
    if (!data.demographicsData) return []
    return Object.entries(data.demographicsData)
      .filter(([, h]) => h.population['2010'] > 0)
      .map(([, h]) => ({
        name: h.name,
        value: Math.round(h.popChange10to20 * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12)
  }, [data.demographicsData])

  if (!data.demographicsData || !kpis) {
    return (
      <div className="text-xs text-muted-foreground">
        Loading demographics data...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-bold text-purple-400">Demographics</div>

      <div className="grid grid-cols-4 gap-2">
        <MiniKpi label="Population" value={kpis.population.toLocaleString()} />
        <MiniKpi label="Vacancy Rate" value={`${kpis.vacancyRate}%`} />
        <MiniKpi label="Avg Pop Change" value={`${kpis.avgPopChange}%`} />
        <MiniKpi label="Neighborhoods" value={String(kpis.neighborhoods)} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Most Populated Neighborhoods
          </div>
          <div className="h-[180px] overflow-hidden">
            <CategoryBarChart data={popChart} horizontal height={180} />
          </div>
        </div>
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Population Change 2010-2020 (%)
          </div>
          <div className="h-[180px] overflow-hidden">
            <CategoryBarChart data={popChangeChart} horizontal height={180} />
          </div>
        </div>
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
