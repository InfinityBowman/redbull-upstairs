import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'
import { useNeighborhoodMetrics } from './useNeighborhoodMetrics'
import { cn } from '@/lib/utils'

function useNeighborhoodName(id: string | null): string | null {
  const data = useData()
  return useMemo(() => {
    if (!id) return null
    const hoodKey = id.padStart(2, '0')
    const hoodFeature = data.neighborhoods?.features.find(
      (f) => String(f.properties.NHD_NUM).padStart(2, '0') === hoodKey,
    )
    return hoodFeature?.properties.NHD_NAME ?? null
  }, [id, data.neighborhoods])
}

function DeltaArrow({
  value,
  invertGood = false,
}: {
  value: number
  invertGood?: boolean
}) {
  if (value === 0) return <span className="text-muted-foreground">—</span>

  const isPositive = invertGood ? value < 0 : value > 0
  const absValue = Math.abs(value)

  return (
    <span
      className={cn(
        'ml-1 text-[0.6rem] font-bold',
        isPositive ? 'text-emerald-400' : 'text-red-400',
      )}
    >
      {value > 0 ? '+' : ''}
      {absValue.toFixed(0)}%
      <span className="ml-0.5">{value > 0 ? '▴' : '▾'}</span>
    </span>
  )
}

function CompareRow({
  label,
  valueA,
  valueB,
  unit = '',
  invertGood = false,
}: {
  label: string
  valueA: number
  valueB: number
  unit?: string
  invertGood?: boolean
}) {
  const diff =
    valueB !== 0 ? ((valueA - valueB) / valueB) * 100 : valueA > 0 ? 100 : 0

  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="w-[38%] text-right">
        <span className="font-semibold text-blue-400">
          {valueA.toLocaleString()}
          {unit}
        </span>
      </div>
      <div className="w-[24%] text-center">
        <span className="text-[0.6rem] text-muted-foreground">{label}</span>
      </div>
      <div className="w-[38%] text-left">
        <span className="font-semibold text-orange-400">
          {valueB.toLocaleString()}
          {unit}
        </span>
        <DeltaArrow value={diff} invertGood={invertGood} />
      </div>
    </div>
  )
}

export function NeighborhoodComparePanel({
  neighborhoodA,
  neighborhoodB,
}: {
  neighborhoodA: string | null
  neighborhoodB: string | null
}) {
  const metricsA = useNeighborhoodMetrics(neighborhoodA)
  const metricsB = useNeighborhoodMetrics(neighborhoodB)
  const nameA = useNeighborhoodName(neighborhoodA)
  const nameB = useNeighborhoodName(neighborhoodB)

  if (!neighborhoodA && !neighborhoodB) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
        Click neighborhoods on the map to compare
      </div>
    )
  }

  // Compute percentage diff for composite score header
  const compositeScoreDiff =
    metricsA && metricsB && metricsB.compositeScore !== 0
      ? ((metricsA.compositeScore - metricsB.compositeScore) / metricsB.compositeScore) * 100
      : metricsA && metricsB && metricsA.compositeScore > 0
        ? 100
        : 0

  return (
    <div className="flex flex-col gap-3 p-3 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-[38%] text-right">
          {nameA ? (
            <span className="font-bold text-blue-400">{nameA}</span>
          ) : (
            <span className="text-muted-foreground">Click to select A</span>
          )}
        </div>
        <div className="w-[24%] text-center text-[0.55rem] text-muted-foreground uppercase tracking-wider">
          vs
        </div>
        <div className="w-[38%] text-left">
          {nameB ? (
            <span className="font-bold text-orange-400">{nameB}</span>
          ) : (
            <span className="text-muted-foreground">Click to select B</span>
          )}
        </div>
      </div>

      {metricsA && metricsB ? (
        <>
          <div className="rounded-lg border-2 border-primary/30 bg-muted/50 p-2.5">
            <div className="flex items-center gap-2">
              <div className="w-[38%] text-right">
                <span className="text-xl font-extrabold text-blue-400">
                  {metricsA.compositeScore}
                </span>
              </div>
              <div className="w-[24%] text-center">
                <div className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Score
                </div>
              </div>
              <div className="w-[38%] text-left">
                <span className="text-xl font-extrabold text-orange-400">
                  {metricsB.compositeScore}
                </span>
                <DeltaArrow value={compositeScoreDiff} />
              </div>
            </div>
          </div>

          <div className="space-y-0.5 border-t border-border/60 pt-2">
            <CompareRow
              label="Transit Score"
              valueA={metricsA.transitScore}
              valueB={metricsB.transitScore}
            />
            <CompareRow
              label="311 Health"
              valueA={metricsA.complaintScore}
              valueB={metricsB.complaintScore}
            />
            <CompareRow
              label="Food Access"
              valueA={metricsA.foodScore}
              valueB={metricsB.foodScore}
            />
            <CompareRow
              label="Vacancy (inv)"
              valueA={metricsA.vacancyScore}
              valueB={metricsB.vacancyScore}
            />
          </div>

          <div className="space-y-0.5 border-t border-border/60 pt-2">
            <CompareRow
              label="311 Complaints"
              valueA={metricsA.totalComplaints}
              valueB={metricsB.totalComplaints}
              invertGood
            />
            <CompareRow
              label="Transit Stops"
              valueA={metricsA.stopsNearby}
              valueB={metricsB.stopsNearby}
            />
            <CompareRow
              label="Total Trips"
              valueA={metricsA.totalTrips}
              valueB={metricsB.totalTrips}
            />
            <CompareRow
              label="Grocery (mi)"
              valueA={metricsA.nearestGroceryDist}
              valueB={metricsB.nearestGroceryDist}
              unit=""
              invertGood
            />
            <CompareRow
              label="Vacant Props"
              valueA={metricsA.vacancyCount}
              valueB={metricsB.vacancyCount}
              invertGood
            />
          </div>
        </>
      ) : (
        <div className="flex h-20 items-center justify-center text-xs text-muted-foreground">
          {neighborhoodA && neighborhoodB
            ? 'Loading comparison data...'
            : 'Click another neighborhood to compare'}
        </div>
      )}
    </div>
  )
}
