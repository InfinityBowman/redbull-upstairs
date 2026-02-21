import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'
import type { FoodDesertProperties } from '@/lib/types'
import { haversine } from '@/lib/equity'

export function GroceryDetail({ id }: { id: number }) {
  const data = useData()

  const store = data.groceryStores?.features[id] ?? null

  const nearestDesert = useMemo(() => {
    if (!store || !data.foodDeserts) return null
    const [sLon, sLat] = store.geometry.coordinates as Array<number>
    let nearest: { name: string; dist: number; tractId: string } | null = null

    data.foodDeserts.features.forEach((f) => {
      const p = f.properties
      if (!p.lila) return
      const coords = f.geometry.coordinates as Array<Array<Array<number>>>
      const centroid = coords[0].reduce(
        (acc, pt) => [
          acc[0] + pt[1] / coords[0].length,
          acc[1] + pt[0] / coords[0].length,
        ],
        [0, 0],
      )
      const dist = haversine(sLat, sLon, centroid[0], centroid[1])
      if (!nearest || dist < nearest.dist) {
        nearest = { name: p.name, dist, tractId: p.tract_id }
      }
    })

    return nearest
  }, [store, data.foodDeserts])

  if (!store) {
    return <div className="text-xs text-muted-foreground">Store not found</div>
  }

  const [lon, lat] = store.geometry.coordinates as Array<number>

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="text-base font-bold">{store.properties.name}</div>

      <DetailRow
        label="Chain"
        value={store.properties.chain || 'Independent'}
      />
      <DetailRow
        label="Location"
        value={`${lat.toFixed(4)}, ${lon.toFixed(4)}`}
      />

      {nearestDesert && (
        <div className="mt-2 rounded-lg bg-muted p-3">
          <div className="mb-1 text-xs font-semibold">
            Nearest Food Desert Tract
          </div>
          <DetailRow
            label="Tract"
            value={(nearestDesert as { name: string }).name}
          />
          <DetailRow
            label="Distance"
            value={`${(nearestDesert as { dist: number }).dist.toFixed(2)} mi`}
          />
        </div>
      )}
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
