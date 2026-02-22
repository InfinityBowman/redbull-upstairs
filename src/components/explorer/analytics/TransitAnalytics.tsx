import { useMemo } from 'react'
import { useData, useFailedDatasets } from '../ExplorerProvider'
import { MiniKpi } from './MiniKpi'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import type { FoodDesertProperties } from '@/lib/types'
import { computeEquityGaps } from '@/lib/equity'
import { equitySeverity } from '@/lib/colors'
import { cn } from '@/lib/utils'

export function TransitAnalytics() {
  const data = useData()
  const failed = useFailedDatasets()

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

  const totalPop = useMemo(
    () =>
      desertTracts.reduce(
        (s, f) => s + ((f.properties).pop || 0),
        0,
      ),
    [desertTracts],
  )

  const worstTracts = useMemo(
    () => gapResults.filter((g) => g.score < 30),
    [gapResults],
  )
  const noAccessTracts = useMemo(
    () => gapResults.filter((g) => !g.groceryAccessible),
    [gapResults],
  )
  const avgScore = useMemo(
    () =>
      gapResults.length
        ? Math.round(
            gapResults.reduce((s, g) => s + g.score, 0) / gapResults.length,
          )
        : 0,
    [gapResults],
  )

  const scoreDistChart = useMemo(() => {
    if (!gapResults.length) return []
    const buckets = [
      { label: '0-19', min: 0, max: 19 },
      { label: '20-39', min: 20, max: 39 },
      { label: '40-59', min: 40, max: 59 },
      { label: '60-79', min: 60, max: 79 },
      { label: '80-100', min: 80, max: 100 },
    ]
    return buckets.map((b) => ({
      name: b.label,
      value: gapResults.filter((g) => g.score >= b.min && g.score <= b.max)
        .length,
    }))
  }, [gapResults])

  const topDesertPopChart = useMemo(() => {
    if (!desertTracts.length) return []
    return desertTracts
      .map((f) => {
        const props = f.properties as FoodDesertProperties
        return {
          name: props.name || props.tract_id || 'Unknown',
          value: props.pop || 0,
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [desertTracts])

  if (!data.stops || !data.routes || !data.foodDeserts || !data.stopStats) {
    if (failed.has('transit') || failed.has('foodAccess')) {
      return (
        <div className="text-xs text-muted-foreground">Transit data unavailable.</div>
      )
    }
    return (
      <div className="text-xs text-muted-foreground">
        Loading transit data...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-2">
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Equity Score Distribution
          </div>
          <div className="h-[180px] overflow-hidden">
            <CategoryBarChart
              data={scoreDistChart}
              horizontal={false}
              height={180}
              valueLabel="Tracts"
            />
          </div>
        </div>
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Top Tracts by Desert Population
          </div>
          <div className="h-[180px] overflow-hidden">
            <CategoryBarChart
              data={topDesertPopChart}
              horizontal
              height={180}
              valueLabel="Population"
            />
          </div>
        </div>
      </div>

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
