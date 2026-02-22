import { useEffect, useState } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'

export function StandaloneNeighborhoodLayer() {
  const [neighborhoods, setNeighborhoods] =
    useState<GeoJSON.FeatureCollection | null>(null)

  useEffect(() => {
    fetch('/data/neighborhoods.geojson')
      .then((res) => res.json())
      .then(setNeighborhoods)
      .catch(console.error)
  }, [])

  if (!neighborhoods) return null

  return (
    <Source
      id="neighborhood-base"
      type="geojson"
      data={neighborhoods as unknown as GeoJSON.GeoJSON}
    >
      <Layer
        id="neighborhood-base-fill"
        type="fill"
        beforeId="waterway-label"
        paint={{
          'fill-color': 'rgba(0,0,0,0.05)',
          'fill-opacity': 0.5,
        }}
      />
      <Layer
        id="neighborhood-base-outline"
        type="line"
        paint={{
          'line-color': 'rgba(0,0,0,0.15)',
          'line-width': 0.5,
        }}
      />
      <Layer
        id="neighborhood-labels"
        type="symbol"
        layout={{
          'text-field': ['get', 'NHD_NAME'],
          'text-size': 10,
          'text-anchor': 'center',
          'text-allow-overlap': false,
        }}
        paint={{
          'text-color': 'rgba(0,0,0,0.5)',
          'text-halo-color': 'rgba(255,255,255,0.8)',
          'text-halo-width': 1.2,
        }}
      />
    </Source>
  )
}
