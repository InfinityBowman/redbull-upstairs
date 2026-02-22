import { useMemo } from 'react'
import { useData, useFailedDatasets } from '../ExplorerProvider'
import { MiniKpi } from './MiniKpi'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'

export function DemographicsAnalytics() {
  const data = useData()
  const failed = useFailedDatasets()

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

  const popGainsChart = useMemo(() => {
    if (!data.demographicsData) return []
    return Object.entries(data.demographicsData)
      .filter(([, h]) => h.population['2010'] > 0 && h.popChange10to20 > 0)
      .map(([, h]) => ({
        name: h.name,
        value: Math.round(h.popChange10to20 * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [data.demographicsData])

  const popDeclinesChart = useMemo(() => {
    if (!data.demographicsData) return []
    return Object.entries(data.demographicsData)
      .filter(([, h]) => h.population['2010'] > 0 && h.popChange10to20 < 0)
      .map(([, h]) => ({
        name: h.name,
        value: Math.round(Math.abs(h.popChange10to20) * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [data.demographicsData])

  if (!data.demographicsData || !kpis) {
    if (failed.has('demographics')) {
      return (
        <div className="text-xs text-muted-foreground">Demographics data unavailable.</div>
      )
    }
    return (
      <div className="text-xs text-muted-foreground">
        Loading demographics data...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-2">
        <MiniKpi label="Population" value={kpis.population.toLocaleString()} />
        <MiniKpi label="Vacancy Rate" value={`${kpis.vacancyRate}%`} />
        <MiniKpi label="Avg Pop Change" value={`${kpis.avgPopChange}%`} />
        <MiniKpi label="Neighborhoods" value={String(kpis.neighborhoods)} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Most Populated Neighborhoods
          </div>
          <div className="h-[180px] overflow-hidden">
            <CategoryBarChart data={popChart} horizontal height={180} valueLabel="Population" />
          </div>
        </div>
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Biggest Gains 2010-2020 (%)
          </div>
          <div className="h-[180px] overflow-hidden">
            <CategoryBarChart data={popGainsChart} horizontal height={180} valueLabel="Growth (%)" />
          </div>
        </div>
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Biggest Declines 2010-2020 (%)
          </div>
          <div className="h-[180px] overflow-hidden">
            <CategoryBarChart data={popDeclinesChart} horizontal height={180} valueLabel="Decline (%)" />
          </div>
        </div>
      </div>
    </div>
  )
}

