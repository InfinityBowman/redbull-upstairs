import { useMemo } from 'react'
import { useData, useExplorer } from '../ExplorerProvider'

export function VacancyAnalytics() {
  const { state } = useExplorer()
  const data = useData()

  const filtered = useMemo(() => {
    if (!data.vacancyData) return []
    const {
      vacancyUseFilter,
      vacancyOwnerFilter,
      vacancyTypeFilter,
      vacancyHoodFilter,
      vacancyMinScore,
      vacancyMaxScore,
    } = state.subToggles
    return data.vacancyData.filter((p) => {
      if (p.triageScore < vacancyMinScore || p.triageScore > vacancyMaxScore) return false
      if (vacancyUseFilter !== 'all' && p.bestUse !== vacancyUseFilter)
        return false
      if (vacancyOwnerFilter === 'lra' && p.owner !== 'LRA') return false
      if (vacancyOwnerFilter === 'private' && p.owner !== 'PRIVATE')
        return false
      if (vacancyOwnerFilter === 'city' && p.owner !== 'CITY') return false
      if (vacancyTypeFilter === 'lot' && p.propertyType !== 'lot') return false
      if (vacancyTypeFilter === 'building' && p.propertyType !== 'building')
        return false
      if (vacancyHoodFilter !== 'all' && p.neighborhood !== vacancyHoodFilter)
        return false
      return true
    })
  }, [data.vacancyData, state.subToggles])

  if (!data.vacancyData) {
    return (
      <div className="text-xs text-muted-foreground">
        Loading vacancy data...
      </div>
    )
  }

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

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <MiniKpi label="Showing" value={String(filtered.length)} />
        <MiniKpi label="Avg Score" value={String(avgScore)} />
        <MiniKpi label="LRA Owned" value={String(lraCount)} />
        <MiniKpi label="High Priority" value={String(topCount)} />
      </div>

      <div className="rounded-lg bg-muted p-2.5">
        <div className="mb-1.5 text-[0.6rem] font-semibold text-muted-foreground">
          Best Use Breakdown
        </div>
        <div className="flex gap-3 text-xs">
          <UseBadge
            label="Housing"
            count={housingCount}
            color="text-blue-400"
          />
          <UseBadge label="Solar" count={solarCount} color="text-amber-400" />
          <UseBadge
            label="Garden"
            count={gardenCount}
            color="text-emerald-400"
          />
        </div>
      </div>

      <div className="rounded-lg bg-muted p-2.5">
        <div className="mb-1.5 text-[0.6rem] font-semibold text-muted-foreground">
          Score Distribution
        </div>
        <div className="flex gap-1">
          {[
            { label: '0-19', range: [0, 19] as const, color: '#d7191c' },
            { label: '20-39', range: [20, 39] as const, color: '#fdae61' },
            { label: '40-59', range: [40, 59] as const, color: '#ffffbf' },
            { label: '60-79', range: [60, 79] as const, color: '#a6d96a' },
            { label: '80+', range: [80, 100] as const, color: '#1a9641' },
          ].map((bucket) => {
            const count = filtered.filter(
              (p) =>
                p.triageScore >= bucket.range[0] &&
                p.triageScore <= bucket.range[1],
            ).length
            const pct = filtered.length ? (count / filtered.length) * 100 : 0
            return (
              <div key={bucket.label} className="flex-1 text-center">
                <div
                  className="mx-auto mb-0.5 rounded-sm"
                  style={{
                    height: `${Math.max(4, pct * 0.8)}px`,
                    background: bucket.color,
                    width: '100%',
                  }}
                />
                <div className="text-[0.5rem] text-muted-foreground">
                  {bucket.label}
                </div>
                <div className="text-[0.55rem] font-semibold">{count}</div>
              </div>
            )
          })}
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
