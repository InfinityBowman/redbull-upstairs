import type {
  EquityGapResult,
  FoodDesertProperties,
  GeoJSONCollection,
  GeoJSONFeature,
  StopStats,
} from './types'

const WALK_RADIUS_MILES = 0.5

/** Haversine distance in miles */
export function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 3959
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Centroid of a GeoJSON polygon */
export function polygonCentroid(coords: Array<Array<Array<number>>>): [number, number] {
  const pts = coords[0]
  let latSum = 0
  let lonSum = 0
  pts.forEach((p) => {
    lonSum += p[0]
    latSum += p[1]
  })
  return [latSum / pts.length, lonSum / pts.length]
}

/** Compute equity gap analysis for all LILA tracts */
export function computeEquityGaps(
  foodDeserts: GeoJSONCollection<FoodDesertProperties>,
  stops: GeoJSONCollection,
  stopStats: Record<string, StopStats>,
  groceryStores: GeoJSONCollection<{ name: string; chain: string }>,
): Array<EquityGapResult> {
  const desertTracts = foodDeserts.features.filter(
    (f) => (f.properties).lila,
  )

  const results = desertTracts.map((tract) => {
    const p = tract.properties
    const centroid = polygonCentroid(tract.geometry.coordinates as Array<Array<Array<number>>>)

    let stopsNearby = 0
    let totalTripFrequency = 0
    let nearestStopDist = Infinity

    stops.features.forEach((stop) => {
      const [lon, lat] = stop.geometry.coordinates as Array<number>
      const dist = haversine(centroid[0], centroid[1], lat, lon)
      if (dist <= WALK_RADIUS_MILES) {
        stopsNearby++
        const stats = stopStats[stop.properties.stop_id as string]
        if (stats) totalTripFrequency += stats.trip_count
      }
      if (dist < nearestStopDist) nearestStopDist = dist
    })

    let nearestGroceryDist = Infinity
    let nearestGroceryName = ''
    groceryStores.features.forEach((store) => {
      const [lon, lat] = store.geometry.coordinates as Array<number>
      const dist = haversine(centroid[0], centroid[1], lat, lon)
      if (dist < nearestGroceryDist) {
        nearestGroceryDist = dist
        nearestGroceryName = store.properties.name
      }
    })

    // Check if a bus route connects tract to grocery
    let groceryAccessible = false
    let transitTimeEstimate: number | null = null

    // Pre-compute tract-nearby stops to avoid re-scanning in inner loop
    const tractNearbyStops = stops.features.filter((s) => {
      const [lon, lat] = s.geometry.coordinates as Array<number>
      return haversine(centroid[0], centroid[1], lat, lon) <= WALK_RADIUS_MILES
    })

    for (const store of groceryStores.features) {
      const [sLon, sLat] = store.geometry.coordinates as Array<number>
      for (const stop of stops.features) {
        const [bLon, bLat] = stop.geometry.coordinates as Array<number>
        const distStopToGrocery = haversine(sLat, sLon, bLat, bLon)
        if (distStopToGrocery > 0.25) continue
        const distStopToTract = haversine(centroid[0], centroid[1], bLat, bLon)
        const stats = stopStats[stop.properties.stop_id as string]
        if (!stats?.routes.length) continue

        for (const tractStop of tractNearbyStops) {
          const [tLon, tLat] = tractStop.geometry.coordinates as Array<number>
          const distToTract = haversine(centroid[0], centroid[1], tLat, tLon)
          const tractStopStats =
            stopStats[tractStop.properties.stop_id as string]
          if (!tractStopStats) continue
          const sharedRoute = tractStopStats.routes.find((r) =>
            stats.routes.includes(r),
          )
          if (sharedRoute) {
            groceryAccessible = true
            const walkToStop = (distToTract / 3) * 60
            const busTime = (distStopToTract / 15) * 60
            const walkToStore = (distStopToGrocery / 3) * 60
            const total = walkToStop + 10 + busTime + walkToStore
            if (!transitTimeEstimate || total < transitTimeEstimate) {
              transitTimeEstimate = total
            }
            break
          }
        }
        if (groceryAccessible) break
      }
      if (groceryAccessible) break
    }

    let score = 0
    score += Math.min(stopsNearby * 10, 30)
    score += Math.min(totalTripFrequency * 0.5, 20)
    score +=
      nearestGroceryDist <= 0.5
        ? 25
        : nearestGroceryDist <= 1
          ? 15
          : nearestGroceryDist <= 2
            ? 5
            : 0
    score += groceryAccessible ? 25 : 0

    return {
      tract_id: p.tract_id,
      name: p.name,
      pop: p.pop,
      poverty_rate: p.poverty_rate,
      pct_no_vehicle: p.pct_no_vehicle,
      stopsNearby,
      totalTripFrequency,
      nearestStopDist,
      nearestGroceryDist,
      nearestGroceryName,
      groceryAccessible,
      transitTimeEstimate,
      score: Math.round(score),
      centroid,
    } satisfies EquityGapResult
  })

  return results.sort((a, b) => a.score - b.score)
}
