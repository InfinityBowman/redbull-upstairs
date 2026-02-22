import { useMemo } from 'react'
import { useData, useFailedDatasets } from '../ExplorerProvider'
import { MiniKpi } from './MiniKpi'
import { haversine, polygonCentroid } from '@/lib/equity'
import { CategoryBarChart } from '@/components/charts/CategoryBarChart'
import { scoreColor } from '@/lib/colors'

export function NeighborhoodAnalytics({ id }: { id: string }) {
  const data = useData()
  const failed = useFailedDatasets()
  const hoodKey = id.padStart(2, '0')

  const hood = data.csbData?.neighborhoods[hoodKey]
  const hoodFeature = data.neighborhoods?.features.find(
    (f) => String(f.properties.NHD_NUM).padStart(2, '0') === hoodKey,
  )

  const centroid = useMemo<[number, number]>(
    () =>
      hoodFeature
        ? polygonCentroid(hoodFeature.geometry.coordinates as Array<Array<Array<number>>>)
        : [38.635, -90.245],
    [hoodFeature],
  )

  const hoodVacancies = useMemo(
    () =>
      hoodFeature && data.vacancyData
        ? data.vacancyData.filter(
            (p) => haversine(centroid[0], centroid[1], p.lat, p.lng) <= 0.5,
          )
        : [],
    [data.vacancyData, hoodFeature, centroid],
  )

  const nearbyStops = useMemo(() => {
    if (!data.stops) return []
    return data.stops.features.filter((stop) => {
      const [lon, lat] = stop.geometry.coordinates as Array<number>
      return haversine(centroid[0], centroid[1], lat, lon) <= 0.5
    })
  }, [data.stops, centroid])

  const catData = useMemo(
    () =>
      hood
        ? Object.entries(hood.topCategories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value]) => ({ name, value }))
        : [],
    [hood],
  )

  if (!hood) {
    if (failed.has('complaints')) {
      return (
        <div className="text-xs text-muted-foreground">Neighborhood data unavailable.</div>
      )
    }
    return (
      <div className="text-xs text-muted-foreground">
        Loading neighborhood data...
      </div>
    )
  }

  const avgVacScore = hoodVacancies.length
    ? Math.round(
        hoodVacancies.reduce((s, p) => s + p.triageScore, 0) /
          hoodVacancies.length,
      )
    : 0

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-bold">{hood.name} — Cross-Dataset View</div>

      <div className="grid grid-cols-4 gap-2">
        <MiniKpi label="311" value={hood.total.toLocaleString()} />
        <MiniKpi label="Vacancies" value={String(hoodVacancies.length)} />
        <MiniKpi label="Stops" value={String(nearbyStops.length)} />
        <MiniKpi label="Avg Triage" value={String(avgVacScore)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Top 311 Issues
          </div>
          <div className="h-[140px]">
            <CategoryBarChart data={catData} horizontal height={140} valueLabel="Complaints" />
          </div>
        </div>
        <div>
          <div className="mb-1 text-[0.6rem] font-semibold text-muted-foreground">
            Best Rehab Candidates
          </div>
          <div className="flex flex-col gap-1">
            {[...hoodVacancies]
              .sort((a, b) => b.triageScore - a.triageScore)
              .slice(0, 5)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-[0.6rem]"
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
        </div>
      </div>
    </div>
  )
}

