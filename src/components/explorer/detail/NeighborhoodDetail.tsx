import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'
import type { FoodDesertProperties } from '@/lib/types'
import { haversine, polygonCentroid } from '@/lib/equity'
import { generateVacancyData } from '@/lib/vacancy-data'
import { scoreColor } from '@/lib/colors'
import { cn } from '@/lib/utils'

export function NeighborhoodDetail({ id }: { id: string }) {
  const data = useData()
  const hoodKey = id.padStart(2, '0')

  const hood = data.csbData?.neighborhoods[hoodKey]
  const hoodFeature = data.neighborhoods?.features.find(
    (f) => String(f.properties.NHD_NUM).padStart(2, '0') === hoodKey,
  )

  const centroid: [number, number] = hoodFeature
    ? polygonCentroid(hoodFeature.geometry.coordinates as Array<Array<Array<number>>>)
    : [38.635, -90.245]

  const allVacancies = useMemo(() => generateVacancyData(), [])
  const hoodVacancies = useMemo(() => {
    if (!hoodFeature) return []
    // Use proximity-based matching (within 0.5mi of centroid) instead of
    // name matching, since CSB and mock data use different neighborhood names
    return allVacancies.filter(
      (p) => haversine(centroid[0], centroid[1], p.lat, p.lng) <= 0.5,
    )
  }, [allVacancies, hoodFeature, centroid])

  const nearbyStops = useMemo(() => {
    if (!data.stops) return []
    return data.stops.features.filter((stop) => {
      const [lon, lat] = stop.geometry.coordinates as Array<number>
      return haversine(centroid[0], centroid[1], lat, lon) <= 0.5
    })
  }, [data.stops, centroid])

  const nearbyRoutes = useMemo(() => {
    if (!data.routes || !data.stopStats) return []
    const routeIds = new Set<string>()
    nearbyStops.forEach((stop) => {
      const stats = data.stopStats![stop.properties.stop_id as string]
      if (stats) stats.routes.forEach((r) => routeIds.add(r))
    })
    return data.routes.filter((r) => routeIds.has(r.route_id))
  }, [nearbyStops, data.stopStats, data.routes])

  const totalFrequency = nearbyStops.reduce((s, stop) => {
    const stats = data.stopStats?.[stop.properties.stop_id as string]
    return s + (stats?.trip_count || 0)
  }, 0)

  const nearestGrocery = useMemo(() => {
    if (!data.groceryStores) return { name: 'N/A', dist: Infinity }
    let nearest = { name: 'N/A', dist: Infinity }
    data.groceryStores.features.forEach((store) => {
      const [lon, lat] = store.geometry.coordinates as Array<number>
      const dist = haversine(centroid[0], centroid[1], lat, lon)
      if (dist < nearest.dist) nearest = { name: store.properties.name, dist }
    })
    return nearest
  }, [data.groceryStores, centroid])

  const isDesert = useMemo(() => {
    if (!data.foodDeserts) return false
    return data.foodDeserts.features.some((f) => {
      const p = f.properties
      if (!p.lila) return false
      const tc = polygonCentroid(f.geometry.coordinates as Array<Array<Array<number>>>)
      return haversine(centroid[0], centroid[1], tc[0], tc[1]) < 0.5
    })
  }, [data.foodDeserts, centroid])

  const avgVacancyScore = hoodVacancies.length
    ? Math.round(
        hoodVacancies.reduce((s, p) => s + p.triageScore, 0) /
          hoodVacancies.length,
      )
    : 0

  const transitScore = Math.min(
    100,
    nearbyStops.length * 15 + Math.min(totalFrequency * 0.3, 30),
  )
  const complaintScore = hood ? Math.max(0, 100 - hood.total / 50) : 50
  const foodScore =
    nearestGrocery.dist <= 0.5
      ? 90
      : nearestGrocery.dist <= 1
        ? 60
        : nearestGrocery.dist <= 2
          ? 30
          : 10
  const compositeScore = Math.round(
    (transitScore + complaintScore + foodScore + (100 - avgVacancyScore)) / 4,
  )

  if (!hood) {
    return (
      <div className="text-xs text-muted-foreground">
        Neighborhood not found
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div>
        <div className="text-base font-bold">{hood.name}</div>
        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[0.6rem] font-semibold text-primary">
          #{hoodKey}
        </span>
      </div>

      {/* Composite score */}
      <div className="rounded-lg border-2 border-primary/30 p-3 text-center">
        <div className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Composite Score
        </div>
        <div className="text-2xl font-extrabold text-primary">
          {compositeScore}
        </div>
        <div className="text-[0.6rem] text-muted-foreground">/100</div>
      </div>

      {/* Score bars */}
      <div className="flex flex-col gap-2">
        <ScoreBar label="Transit Access" score={Math.round(transitScore)} />
        <ScoreBar label="311 Health" score={Math.round(complaintScore)} />
        <ScoreBar label="Food Access" score={foodScore} />
        <ScoreBar label="Vacancy (inverse)" score={100 - avgVacancyScore} />
      </div>

      {/* 311 */}
      <Section title="311 Complaints" color="text-indigo-400">
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
      </Section>

      {/* Vacancy */}
      <Section title="Vacancy" color="text-amber-400">
        <DetailRow label="Properties" value={String(hoodVacancies.length)} />
        <DetailRow
          label="LRA Owned"
          value={String(hoodVacancies.filter((p) => p.owner === 'LRA').length)}
        />
        <DetailRow label="Avg Triage Score" value={String(avgVacancyScore)} />
        {hoodVacancies.length > 0 && (
          <div className="mt-1.5">
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
                    className="font-bold"
                    style={{ color: scoreColor(p.triageScore) }}
                  >
                    {p.triageScore}
                  </span>
                </div>
              ))}
          </div>
        )}
      </Section>

      {/* Transit */}
      <Section title="Transit & Food" color="text-purple-400">
        <DetailRow label="Stops (0.5mi)" value={String(nearbyStops.length)} />
        <DetailRow
          label="Routes"
          value={
            nearbyRoutes
              .map((r) => r.route_short_name || r.route_long_name)
              .join(', ') || 'None'
          }
        />
        <DetailRow label="Trips/day" value={String(totalFrequency)} />
        <DetailRow
          label="Nearest Grocery"
          value={`${nearestGrocery.name} (${nearestGrocery.dist.toFixed(2)}mi)`}
        />
        {isDesert && (
          <div className="mt-1 text-[0.65rem] font-semibold text-red-400">
            In a food desert area
          </div>
        )}
      </Section>
    </div>
  )
}

function Section({
  title,
  color,
  children,
}: {
  title: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg bg-muted p-2.5">
      <div className={cn('mb-1.5 text-[0.65rem] font-bold', color)}>
        {title}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-[0.65rem]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full', color)}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/30 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
