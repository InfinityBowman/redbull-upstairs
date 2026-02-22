import { useMemo } from 'react'
import { useData, useExplorer, useFailedDatasets } from '../ExplorerProvider'
import { MiniKpi } from './MiniKpi'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import { filterVacancies } from '@/lib/analysis'

export function VacancyAnalytics() {
  const { state } = useExplorer()
  const data = useData()
  const failed = useFailedDatasets()

  const filtered = useMemo(
    () => (data.vacancyData ? filterVacancies(data.vacancyData, state.subToggles) : []),
    [data.vacancyData, state.subToggles],
  )

  const stats = useMemo(() => {
    const avgScore = filtered.length
      ? Math.round(
          filtered.reduce((s, p) => s + p.triageScore, 0) / filtered.length,
        )
      : 0
    const lraCount = filtered.filter((p) => p.owner === 'LRA').length
    const topCount = filtered.filter((p) => p.triageScore >= 80).length
    const housingCount = filtered.filter((p) => p.bestUse === 'housing').length
    const solarCount = filtered.filter((p) => p.bestUse === 'solar').length
    const gardenCount = filtered.filter((p) => p.bestUse === 'garden').length
    return { avgScore, lraCount, topCount, housingCount, solarCount, gardenCount }
  }, [filtered])

  const scoreDistChart = useMemo(() => {
    if (!filtered.length) return []
    const buckets = [
      { label: '0-19', min: 0, max: 19 },
      { label: '20-39', min: 20, max: 39 },
      { label: '40-59', min: 40, max: 59 },
      { label: '60-79', min: 60, max: 79 },
      { label: '80+', min: 80, max: 100 },
    ]
    return buckets.map((b) => ({
      name: b.label,
      value: filtered.filter(
        (p) => p.triageScore >= b.min && p.triageScore <= b.max,
      ).length,
    }))
  }, [filtered])

  const topHoodChart = useMemo(() => {
    if (!filtered.length) return []
    const counts: Record<string, number> = {}
    for (const p of filtered) {
      counts[p.neighborhood] = (counts[p.neighborhood] || 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }))
  }, [filtered])

  if (!data.vacancyData) {
    if (failed.has('vacancy')) {
      return (
        <div className="text-xs text-muted-foreground">Vacancy data unavailable.</div>
      )
    }
    return (
      <div className="text-xs text-muted-foreground">
        Loading vacancy data...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-2">
        <MiniKpi label="Showing" value={String(filtered.length)} />
        <MiniKpi label="Avg Score" value={String(stats.avgScore)} />
        <MiniKpi label="LRA Owned" value={String(stats.lraCount)} />
        <MiniKpi label="High Priority" value={String(stats.topCount)} />
      </div>

      <div className="rounded-lg bg-muted p-2.5">
        <div className="mb-1.5 text-[0.6rem] font-semibold text-muted-foreground">
          Best Use Breakdown
        </div>
        <div className="flex gap-3 text-xs">
          <UseBadge
            label="Housing"
            count={stats.housingCount}
            color="text-blue-400"
          />
          <UseBadge label="Solar" count={stats.solarCount} color="text-amber-400" />
          <UseBadge
            label="Garden"
            count={stats.gardenCount}
            color="text-emerald-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Score Distribution
          </div>
          <div className="h-[180px] overflow-hidden">
            <CategoryBarChart
              data={scoreDistChart}
              horizontal={false}
              height={180}
              valueLabel="Properties"
            />
          </div>
        </div>
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Top Neighborhoods by Vacancy
          </div>
          <div className="h-[180px] overflow-hidden">
            <CategoryBarChart
              data={topHoodChart}
              horizontal
              height={180}
              valueLabel="Vacancies"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function UseBadge({
  label,
  count,
  color,
}: {
  label: string
  count: number
  color: string
}) {
  return (
    <div className="flex items-center gap-1">
      <span className={`text-xs font-bold ${color}`}>{count}</span>
      <span className="text-[0.6rem] text-muted-foreground">{label}</span>
    </div>
  )
}
