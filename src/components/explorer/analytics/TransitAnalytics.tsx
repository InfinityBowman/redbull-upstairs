import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'
import type { FoodDesertProperties } from '@/lib/types'
import { computeEquityGaps } from '@/lib/equity'
import { equitySeverity } from '@/lib/colors'
import { cn } from '@/lib/utils'

export function TransitAnalytics() {
  const data = useData()

  const gapResults = useMemo(() => {
    if (
      !data.foodDeserts ||
      !data.stops ||
      !data.stopStats ||
      !data.groceryStores
    )
      return []
    return computeEquityGaps(
      data.foodDeserts,
      data.stops,
      data.stopStats,
      data.groceryStores,
    )
  }, [data.foodDeserts, data.stops, data.stopStats, data.groceryStores])

  const desertTracts = useMemo(
    () =>
      data.foodDeserts?.features.filter(
        (f) => (f.properties).lila,
      ) ?? [],
    [data.foodDeserts],
  )

  const totalPop = desertTracts.reduce(
    (s, f) => s + ((f.properties).pop || 0),
    0,
  )

  const worstTracts = gapResults.filter((g) => g.score < 30)
  const noAccessTracts = gapResults.filter((g) => !g.groceryAccessible)
  const avgScore = gapResults.length
    ? Math.round(
        gapResults.reduce((s, g) => s + g.score, 0) / gapResults.length,
      )
    : 0

  if (!data.stops || !data.routes) {
    return (
      <div className="text-xs text-muted-foreground">
        Loading transit data...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <MiniKpi
          label="Stops"
          value={data.stops.features.length.toLocaleString()}
        />
        <MiniKpi label="Routes" value={String(data.routes.length)} />
        <MiniKpi label="LILA Tracts" value={String(desertTracts.length)} />
        <MiniKpi label="Desert Pop" value={totalPop.toLocaleString()} />
      </div>

      {gapResults.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-card p-2.5 text-[0.65rem] leading-relaxed dark:border-red-900/30 dark:from-red-950/30">
          <strong className="text-red-600 dark:text-red-400">
            {worstTracts.length}
          </strong>{' '}
          tracts with critically poor access.{' '}
          <strong className="text-red-600 dark:text-red-400">
            {noAccessTracts.length}
          </strong>{' '}
          with no bus to grocery. Avg score:{' '}
          <strong className="text-red-600 dark:text-red-400">
            {avgScore}/100
          </strong>
          .
        </div>
      )}

      <div className="flex max-h-[150px] flex-col gap-1.5 overflow-y-auto">
        {gapResults.slice(0, 8).map((g) => {
          const sev = equitySeverity(g.score)
          const scoreClass =
            g.score < 30
              ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
              : g.score < 60
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
          const borderClass =
            sev === 'high'
              ? 'border-l-red-500'
              : sev === 'medium'
                ? 'border-l-amber-500'
                : 'border-l-emerald-500'
          return (
            <div
              key={g.tract_id}
              className={cn(
                'rounded-lg border-l-[3px] bg-muted p-2',
                borderClass,
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] font-semibold">{g.name}</span>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[0.55rem] font-bold',
                    scoreClass,
                  )}
                >
                  {g.score}/100
                </span>
              </div>
            </div>
          )
        })}
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
