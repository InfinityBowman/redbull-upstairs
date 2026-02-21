import { Layer, Source } from 'react-map-gl/mapbox'
import { useData, useExplorer } from '../ExplorerProvider'

export function NeighborhoodBaseLayer() {
  const data = useData()
  const { state } = useExplorer()

  if (!data.neighborhoods) return null

  const selectedId =
    state.selected?.type === 'neighborhood' ? state.selected.id : null

  return (
    <Source id="neighborhood-base" type="geojson" data={data.neighborhoods}>
      <Layer
        id="neighborhood-base-fill"
        type="fill"
        beforeId="waterway-label"
        paint={{
          'fill-color': [
            'case',
            ['==', ['to-string', ['get', 'NHD_NUM']], selectedId ?? ''],
            'rgba(99,102,241,0.25)',
            'transparent',
          ],
          'fill-opacity': 0.5,
        }}
      />
      <Layer
        id="neighborhood-base-outline"
        type="line"
        beforeId="waterway-label"
        paint={{
          'line-color': [
            'case',
            ['==', ['to-string', ['get', 'NHD_NUM']], selectedId ?? ''],
            '#6366f1',
            'rgba(255,255,255,0.12)',
          ],
          'line-width': [
            'case',
            ['==', ['to-string', ['get', 'NHD_NUM']], selectedId ?? ''],
            2.5,
            0.5,
          ],
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
