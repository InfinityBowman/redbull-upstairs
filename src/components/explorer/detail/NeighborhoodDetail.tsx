import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'
import { DetailRow, DetailSection, ScoreBar } from './shared'
import { useNeighborhoodMetrics } from './useNeighborhoodMetrics'
import { haversine, polygonCentroid } from '@/lib/equity'
import { scoreColor } from '@/lib/colors'

export function NeighborhoodDetail({ id }: { id: string }) {
  const data = useData()
  const hoodKey = id.padStart(2, '0')
  const metrics = useNeighborhoodMetrics(id)

  const hood = data.csbData?.neighborhoods[hoodKey]

  const hoodVacancies = useMemo(() => {
    if (!metrics || !data.vacancyData) return []
    return data.vacancyData.filter(
      (p) => haversine(metrics.centroid[0], metrics.centroid[1], p.lat, p.lng) <= 0.5,
    )
  }, [data.vacancyData, metrics])

  const nearbyRoutes = useMemo(() => {
    if (!data.routes || !data.stopStats || !data.stops || !metrics) return []
    const routeIds = new Set<string>()
    const nearbyStops = data.stops.features.filter((stop) => {
      const [lon, lat] = stop.geometry.coordinates as Array<number>
      return haversine(metrics.centroid[0], metrics.centroid[1], lat, lon) <= 0.5
    })
    nearbyStops.forEach((stop) => {
      const stats = data.stopStats![stop.properties.stop_id as string]
      if (stats) stats.routes.forEach((r) => routeIds.add(r))
    })
    return data.routes.filter((r) => routeIds.has(r.route_id))
  }, [data.stops, data.stopStats, data.routes, metrics])

  const isDesert = useMemo(() => {
    if (!data.foodDeserts || !metrics) return false
    return data.foodDeserts.features.some((f) => {
      const p = f.properties
      if (!p.lila) return false
      const tc = polygonCentroid(
        f.geometry.coordinates as Array<Array<Array<number>>>,
      )
      return haversine(metrics.centroid[0], metrics.centroid[1], tc[0], tc[1]) < 0.5
    })
  }, [data.foodDeserts, metrics])

  if (!hood || !metrics) {
    return (
      <div className="text-xs text-muted-foreground">
        Neighborhood not found
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* Name + ID + Composite score */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-bold leading-tight">{metrics.name}</div>
          <span className="mt-0.5 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[0.6rem] font-semibold text-primary">
            #{hoodKey}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-center rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5">
          <div className="text-xl font-extrabold tabular-nums leading-tight text-primary">
            {metrics.compositeScore}
          </div>
          <div className="text-[0.5rem] font-medium uppercase tracking-wider text-muted-foreground">
            Score
          </div>
        </div>
      </div>

      {/* Score bars */}
      <div className="flex flex-col gap-2">
        <ScoreBar label="Transit Access" score={metrics.transitScore} />
        <ScoreBar label="311 Health" score={metrics.complaintScore} />
        <ScoreBar label="Food Access" score={metrics.foodScore} />
        <ScoreBar label="Vacancy (inverse)" score={metrics.vacancyScore} />
      </div>

      {/* 311 */}
      <DetailSection title="311 Complaints" color="text-indigo-400">
        <DetailRow label="Total" value={hood.total.toLocaleString()} />
        <DetailRow label="Closed" value={String(hood.closed)} />
        <DetailRow
          label="Avg Resolution"
          value={`${hood.avgResolutionDays}d`}
        />
        {Object.entries(hood.topCategories)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([cat, count]) => (
            <DetailRow key={cat} label={cat} value={String(count)} />
          ))}
      </DetailSection>

      {/* Vacancy */}
      <DetailSection title="Vacancy" color="text-amber-400">
        <DetailRow label="Properties" value={String(hoodVacancies.length)} />
        <DetailRow
          label="LRA Owned"
          value={String(hoodVacancies.filter((p) => p.owner === 'LRA').length)}
        />
        <DetailRow label="Avg Triage Score" value={String(metrics.avgTriageScore)} />
        {hoodVacancies.length > 0 && (
          <div className="pt-2">
            <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
              Top Candidates
            </div>
            {[...hoodVacancies]
              .sort((a, b) => b.triageScore - a.triageScore)
              .slice(0, 3)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-0.5"
                >
                  <span className="truncate">{p.address}</span>
                  <span
                    className="font-bold tabular-nums"
                    style={{ color: scoreColor(p.triageScore) }}
                  >
                    {p.triageScore}
                  </span>
                </div>
              ))}
          </div>
        )}
      </DetailSection>

      {/* Transit & Food */}
      <DetailSection title="Transit & Food" color="text-blue-400">
        <DetailRow label="Stops (0.5mi)" value={String(metrics.stopsNearby)} />
        <DetailRow
          label="Routes"
          value={
            nearbyRoutes
              .map((r) => r.route_short_name || r.route_long_name)
              .join(', ') || 'None'
          }
        />
        <DetailRow label="Total Trips" value={String(metrics.totalTrips)} />
        <DetailRow
          label="Nearest Grocery"
          value={metrics.nearestGroceryDist === Infinity
            ? 'N/A'
            : `${metrics.nearestGroceryName} (${metrics.nearestGroceryDist.toFixed(2)}mi)`}
        />
        {isDesert && (
          <div className="pt-1.5 text-[0.65rem] font-semibold text-red-400">
            In a food desert area
          </div>
        )}
      </DetailSection>
    </div>
  )
}
