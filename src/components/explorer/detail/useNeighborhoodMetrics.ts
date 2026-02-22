import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'
import { haversine, polygonCentroid } from '@/lib/equity'

export interface NeighborhoodMetrics {
  name: string
  compositeScore: number
  transitScore: number
  complaintScore: number
  foodScore: number
  vacancyScore: number
  totalComplaints: number
  stopsNearby: number
  tripsPerDay: number
  nearestGroceryDist: number
  nearestGroceryName: string
  vacancyCount: number
  avgTriageScore: number
  centroid: [number, number]
}

export function useNeighborhoodMetrics(id: string | null): NeighborhoodMetrics | null {
  const data = useData()

  return useMemo(() => {
    if (!id) return null

    const hoodKey = id.padStart(2, '0')
    const hood = data.csbData?.neighborhoods[hoodKey]
    const hoodFeature = data.neighborhoods?.features.find(
      (f) => String(f.properties.NHD_NUM).padStart(2, '0') === hoodKey,
    )

    if (!hoodFeature) return null

    const centroid: [number, number] = polygonCentroid(
      hoodFeature.geometry.coordinates as Array<Array<Array<number>>>,
    )

    const vacancies = data.vacancyData ?? []
    const hoodVacancies = vacancies.filter(
      (p) => haversine(centroid[0], centroid[1], p.lat, p.lng) <= 0.5,
    )

    const nearbyStops =
      data.stops?.features.filter((stop) => {
        const [lon, lat] = stop.geometry.coordinates as Array<number>
        return haversine(centroid[0], centroid[1], lat, lon) <= 0.5
      }) || []

    const totalFrequency = nearbyStops.reduce((s, stop) => {
      const stats = data.stopStats?.[stop.properties.stop_id as string]
      return s + (stats?.trip_count || 0)
    }, 0)

    let nearestGroceryDist = Infinity
    let nearestGroceryName = 'N/A'
    if (data.groceryStores) {
      data.groceryStores.features.forEach((store) => {
        const [lon, lat] = store.geometry.coordinates as Array<number>
        const dist = haversine(centroid[0], centroid[1], lat, lon)
        if (dist < nearestGroceryDist) {
          nearestGroceryDist = dist
          nearestGroceryName = store.properties.name
        }
      })
    }

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
      nearestGroceryDist <= 0.5
        ? 90
        : nearestGroceryDist <= 1
          ? 60
          : nearestGroceryDist <= 2
            ? 30
            : 10
    const compositeScore = Math.round(
      (transitScore + complaintScore + foodScore + (100 - avgVacancyScore)) / 4,
    )

    const name =
      hood?.name || hoodFeature.properties.NHD_NAME || `Neighborhood ${hoodKey}`

    return {
      name,
      compositeScore,
      transitScore: Math.round(transitScore),
      complaintScore: Math.round(complaintScore),
      foodScore,
      vacancyScore: 100 - avgVacancyScore,
      totalComplaints: hood?.total ?? 0,
      stopsNearby: nearbyStops.length,
      tripsPerDay: totalFrequency,
      nearestGroceryDist,
      nearestGroceryName,
      vacancyCount: hoodVacancies.length,
      avgTriageScore: avgVacancyScore,
      centroid,
    }
  }, [id, data])
}
