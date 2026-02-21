import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'
import type { FoodDesertProperties } from '@/lib/types'
import { haversine, polygonCentroid } from '@/lib/equity'
import { equitySeverity } from '@/lib/colors'
import { cn } from '@/lib/utils'

export function FoodDesertDetail({ id }: { id: string }) {
  const data = useData()

  const tract = useMemo(() => {
    if (!data.foodDeserts) return null
    return (
      data.foodDeserts.features.find(
        (f) => (f.properties).tract_id === id,
      ) ?? null
    )
  }, [data.foodDeserts, id])

  const props = tract?.properties

  const centroid = tract
    ? polygonCentroid(tract.geometry.coordinates as Array<Array<Array<number>>>)
    : null

  // Nearby stops + frequency
  const nearbyStopData = useMemo(() => {
    if (!data.stops || !centroid) return { count: 0, frequency: 0 }
    let count = 0
    let frequency = 0
    data.stops.features.forEach((stop) => {
      const [lon, lat] = stop.geometry.coordinates as Array<number>
      if (haversine(centroid[0], centroid[1], lat, lon) <= 0.5) {
        count++
        const stats = data.stopStats?.[stop.properties.stop_id as string]
        if (stats) frequency += stats.trip_count
      }
    })
    return { count, frequency }
  }, [data.stops, data.stopStats, centroid])

  // Nearest grocery
  const nearestGrocery = useMemo(() => {
    if (!data.groceryStores || !centroid) return null
    let nearest: { name: string; dist: number } | null = null
    data.groceryStores.features.forEach((store) => {
      const [lon, lat] = store.geometry.coordinates as Array<number>
      const dist = haversine(centroid[0], centroid[1], lat, lon)
      if (!nearest || dist < nearest.dist) {
        nearest = { name: store.properties.name, dist }
      }
    })
    return nearest
  }, [data.groceryStores, centroid])

  // Grocery accessible via transit
  const groceryAccessible = useMemo(() => {
    if (!data.stops || !data.stopStats || !data.groceryStores || !centroid)
      return false
    for (const store of data.groceryStores.features) {
      const [sLon, sLat] = store.geometry.coordinates as Array<number>
      for (const stop of data.stops.features) {
        const [bLon, bLat] = stop.geometry.coordinates as Array<number>
        if (haversine(sLat, sLon, bLat, bLon) > 0.25) continue
        const stats = data.stopStats[stop.properties.stop_id as string]
        if (!stats?.routes.length) continue
        for (const tractStop of data.stops.features) {
          const [tLon, tLat] = tractStop.geometry.coordinates as Array<number>
          if (haversine(centroid[0], centroid[1], tLat, tLon) > 0.5) continue
          const tractStats =
            data.stopStats[tractStop.properties.stop_id as string]
          if (tractStats?.routes.some((r) => stats.routes.includes(r)))
            return true
        }
      }
    }
    return false
  }, [data.stops, data.stopStats, data.groceryStores, centroid])

  // Equity score — matches computeEquityGaps factors
  const equityScore = useMemo(() => {
    let score = 0
    score += Math.min(nearbyStopData.count * 10, 30)
    score += Math.min(nearbyStopData.frequency * 0.5, 20)
    if (nearestGrocery) {
      score +=
        nearestGrocery.dist <= 0.5
          ? 25
          : nearestGrocery.dist <= 1
            ? 15
            : nearestGrocery.dist <= 2
              ? 5
              : 0
    }
    score += groceryAccessible ? 25 : 0
    return Math.round(score)
  }, [nearbyStopData, nearestGrocery, groceryAccessible])

  if (!tract || !props) {
    return <div className="text-xs text-muted-foreground">Tract not found</div>
  }

  const sev = equitySeverity(equityScore)
  const scoreClass =
    sev === 'high'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
      : sev === 'medium'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="text-base font-bold">{props.name}</div>
      <span
        className={cn(
          'inline-block self-start rounded-full px-2.5 py-0.5 text-[0.6rem] font-bold',
          props.lila
            ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
        )}
      >
        {props.lila ? 'LILA Food Desert' : 'Not LILA'}
      </span>

      <DetailRow label="Tract ID" value={props.tract_id} />
      <DetailRow
        label="Population"
        value={props.pop?.toLocaleString() ?? 'N/A'}
      />
      <DetailRow label="Poverty Rate" value={`${props.poverty_rate}%`} />
      <DetailRow
        label="Median Income"
        value={`$${props.median_income?.toLocaleString() ?? 'N/A'}`}
      />
      <DetailRow label="No Vehicle" value={`${props.pct_no_vehicle}%`} />

      <div className="mt-2 rounded-lg bg-muted p-3">
        <div className="mb-1.5 text-xs font-semibold">Access Analysis</div>
        <DetailRow label="Transit Stops (0.5mi)" value={String(nearbyStopData.count)} />
        {nearestGrocery && (
          <>
            <DetailRow label="Nearest Grocery" value={nearestGrocery.name} />
            <DetailRow
              label="Distance"
              value={`${nearestGrocery.dist.toFixed(2)} mi`}
            />
          </>
        )}
        <div className="mt-2">
          <span
            className={cn(
              'rounded px-2 py-0.5 text-[0.65rem] font-bold',
              scoreClass,
            )}
          >
            Equity Score: {equityScore}/100
          </span>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/50 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
