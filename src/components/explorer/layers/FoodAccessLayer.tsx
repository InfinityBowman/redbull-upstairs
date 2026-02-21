import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useData, useExplorer } from '../ExplorerProvider'
import type { FoodDesertProperties } from '@/lib/types'

export function FoodAccessLayer() {
  const { state } = useExplorer()
  const data = useData()

  const desertGeo = useMemo(() => {
    if (!data.foodDeserts) return null
    return {
      type: 'FeatureCollection' as const,
      features: data.foodDeserts.features.filter(
        (f) => (f.properties).lila,
      ),
    }
  }, [data.foodDeserts])

  const groceryPointsGeo = useMemo(() => {
    if (!data.groceryStores) return null
    return {
      type: 'FeatureCollection' as const,
      features: data.groceryStores.features.map((s, i) => ({
        type: 'Feature' as const,
        properties: { ...s.properties, idx: i },
        geometry: {
          type: 'Point' as const,
          coordinates: s.geometry.coordinates,
        },
      })),
    }
  }, [data.groceryStores])

  if (!data.foodDeserts) return null

  return (
    <>
      {/* Food desert tracts */}
      {state.subToggles.foodDesertTracts && desertGeo && (
        <Source id="food-deserts" type="geojson" data={desertGeo}>
          <Layer
            id="desert-fill"
            type="fill"
            beforeId="waterway-label"
            paint={{
              'fill-color': '#ef4444',
              'fill-opacity': [
                'interpolate',
                ['linear'],
                ['get', 'poverty_rate'],
                0,
                0.25,
                100,
                0.7,
              ],
            }}
          />
          <Layer
            id="desert-outline"
            type="line"
            beforeId="waterway-label"
            paint={{
              'line-color': '#dc2626',
              'line-width': 2,
              'line-opacity': 0.8,
            }}
          />
        </Source>
      )}

      {/* Grocery stores */}
      {state.subToggles.groceryStores && groceryPointsGeo && (
        <Source id="grocery-stores" type="geojson" data={groceryPointsGeo}>
          <Layer
            id="grocery-circles"
            type="circle"
            paint={{
              'circle-radius': 7,
              'circle-color': '#059669',
              'circle-stroke-color': '#ecfdf5',
              'circle-stroke-width': 2,
            }}
          />
        </Source>
      )}
    </>
  )
}
