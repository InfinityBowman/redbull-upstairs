import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useData, useExplorer } from '../ExplorerProvider'

export function TransitLayer() {
  const { state } = useExplorer()
  const data = useData()

  // Stops with stats
  const stopsWithStats = useMemo(() => {
    if (!data.stops || !data.stopStats) return null
    const features = data.stops.features.map((stop) => {
      const stats = data.stopStats![stop.properties.stop_id as string] || {
        trip_count: 0,
        routes: [],
      }
      return {
        ...stop,
        properties: {
          ...stop.properties,
          trip_count: stats.trip_count,
          route_count: stats.routes.length,
        },
      }
    })
    return { type: 'FeatureCollection' as const, features }
  }, [data.stops, data.stopStats])

  // Walkshed circles
  const walkshedGeo = useMemo(() => {
    if (!data.stops) return null
    const features = data.stops.features.map((stop) => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'Point' as const,
        coordinates: stop.geometry.coordinates,
      },
    }))
    return { type: 'FeatureCollection' as const, features }
  }, [data.stops])

  if (!data.stops) return null

  return (
    <>
      {/* Walkshed */}
      {state.subToggles.transitWalkshed && walkshedGeo && (
        <Source id="walkshed" type="geojson" data={walkshedGeo}>
          <Layer
            id="walkshed-circles"
            type="circle"
            paint={{
              'circle-radius': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                10,
                3,
                14,
                60,
                18,
                400,
              ],
              'circle-color': '#60a5fa',
              'circle-opacity': 0.06,
              'circle-stroke-width': 0.5,
              'circle-stroke-color': '#3b82f6',
              'circle-stroke-opacity': 0.2,
            }}
          />
        </Source>
      )}

      {/* Routes */}
      {state.subToggles.transitRoutes && data.shapes && (
        <Source id="transit-routes" type="geojson" data={data.shapes}>
          <Layer
            id="route-lines"
            type="line"
            paint={{
              'line-color': '#a78bfa',
              'line-width': 2.5,
              'line-opacity': 0.6,
            }}
          />
        </Source>
      )}

      {/* Stops */}
      {state.subToggles.transitStops && stopsWithStats && (
        <Source id="transit-stops" type="geojson" data={stopsWithStats}>
          <Layer
            id="stops-circles"
            type="circle"
            paint={{
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'trip_count'],
                0,
                3,
                50,
                5,
                200,
                8,
              ],
              'circle-color': '#60a5fa',
              'circle-opacity': 0.7,
              'circle-stroke-color': '#2563eb',
              'circle-stroke-width': 1,
            }}
          />
        </Source>
      )}
    </>
  )
}
