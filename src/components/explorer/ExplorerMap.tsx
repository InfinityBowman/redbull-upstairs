import { useCallback } from 'react'
import { useData, useExplorer } from './ExplorerProvider'
import { NeighborhoodBaseLayer } from './layers/NeighborhoodBaseLayer'
import { ComplaintsLayer } from './layers/ComplaintsLayer'
import { TransitLayer } from './layers/TransitLayer'
import { VacancyLayer } from './layers/VacancyLayer'
import { FoodAccessLayer } from './layers/FoodAccessLayer'
import { MapProvider } from '@/components/map/MapProvider'

export function ExplorerMap() {
  const { state, dispatch } = useExplorer()
  const data = useData()

  const handleMapLoad = useCallback(
    (map: mapboxgl.Map) => {
      // Unified click handler using queryRenderedFeatures
      map.on('click', (e) => {
        const point = e.point

        // 1. Check vacancy markers first (most specific points)
        const vacancyFeatures = map
          .queryRenderedFeatures(point, { layers: ['vacancy-circles'] })
          .filter(Boolean)
        if (vacancyFeatures.length > 0) {
          const id = vacancyFeatures[0].properties?.id
          if (id != null) {
            dispatch({
              type: 'SELECT_ENTITY',
              entity: { type: 'vacancy', id: Number(id) },
            })
            return
          }
        }

        // 2. Transit stops
        const stopFeatures = map
          .queryRenderedFeatures(point, { layers: ['stops-circles'] })
          .filter(Boolean)
        if (stopFeatures.length > 0) {
          const id = stopFeatures[0].properties?.stop_id
          if (id) {
            dispatch({
              type: 'SELECT_ENTITY',
              entity: { type: 'stop', id: String(id) },
            })
            return
          }
        }

        // 3. Grocery stores
        const groceryFeatures = map
          .queryRenderedFeatures(point, { layers: ['grocery-circles'] })
          .filter(Boolean)
        if (groceryFeatures.length > 0) {
          const idx = groceryFeatures[0].properties?.idx
          if (idx != null) {
            dispatch({
              type: 'SELECT_ENTITY',
              entity: { type: 'grocery', id: Number(idx) },
            })
            return
          }
        }

        // 4. Food desert tracts
        const desertFeatures = map
          .queryRenderedFeatures(point, { layers: ['desert-fill'] })
          .filter(Boolean)
        if (desertFeatures.length > 0) {
          const tractId = desertFeatures[0].properties?.tract_id
          if (tractId) {
            dispatch({
              type: 'SELECT_ENTITY',
              entity: { type: 'foodDesert', id: String(tractId) },
            })
            return
          }
        }

        // 5. Neighborhood polygons
        const hoodFeatures = map
          .queryRenderedFeatures(point, { layers: ['neighborhood-base-fill'] })
          .filter(Boolean)
        if (hoodFeatures.length > 0) {
          const nhdNum = hoodFeatures[0].properties?.NHD_NUM
          if (nhdNum != null) {
            dispatch({
              type: 'SELECT_ENTITY',
              entity: {
                type: 'neighborhood',
                id: String(nhdNum).padStart(2, '0'),
              },
            })
            return
          }
        }

        // Empty space — clear
        dispatch({ type: 'CLEAR_SELECTION' })
      })

      // Pointer cursor on hover
      const interactiveLayers = [
        'vacancy-circles',
        'stops-circles',
        'grocery-circles',
        'desert-fill',
        'neighborhood-base-fill',
      ]

      map.on('mousemove', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: interactiveLayers,
        })
        map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : ''
      })
    },
    [dispatch],
  )

  return (
    <MapProvider className="h-full w-full" onMapLoad={handleMapLoad}>
      {data.neighborhoods && <NeighborhoodBaseLayer />}
      {state.layers.complaints && <ComplaintsLayer />}
      {state.layers.transit && <TransitLayer />}
      {state.layers.vacancy && <VacancyLayer />}
      {state.layers.foodAccess && <FoodAccessLayer />}
    </MapProvider>
  )
}
