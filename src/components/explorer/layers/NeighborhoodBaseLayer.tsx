import { Layer, Source } from 'react-map-gl/mapbox'
import { useData, useExplorer } from '../ExplorerProvider'

export function NeighborhoodBaseLayer() {
  const data = useData()
  const { state } = useExplorer()

  if (!data.neighborhoods) return null

  const selectedId =
    state.selected?.type === 'neighborhood' ? state.selected.id : null
  // Parse to number for direct comparison with NHD_NUM (integer in GeoJSON)
  const selectedNum = selectedId ? parseInt(selectedId, 10) : null

  const matchExpr: mapboxgl.Expression = [
    '==',
    ['get', 'NHD_NUM'],
    selectedNum ?? -1,
  ]

  return (
    <Source id="neighborhood-base" type="geojson" data={data.neighborhoods}>
      <Layer
        id="neighborhood-base-fill"
        type="fill"
        beforeId="waterway-label"
        paint={{
          'fill-color': [
            'case',
            matchExpr,
            'rgba(99,102,241,0.25)',
            'transparent',
          ],
          'fill-opacity': 0.5,
        }}
      />
      <Layer
        id="neighborhood-base-outline"
        type="line"
        paint={{
          'line-color': ['case', matchExpr, '#6366f1', 'rgba(255,255,255,0.12)'],
          'line-width': ['case', matchExpr, 2.5, 0.5],
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
          'text-color': 'rgba(255,255,255,0.5)',
          'text-halo-color': 'rgba(0,0,0,0.6)',
          'text-halo-width': 1,
        }}
      />
    </Source>
  )
}
