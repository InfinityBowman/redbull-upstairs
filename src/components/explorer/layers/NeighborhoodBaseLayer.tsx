import { Layer, Source } from 'react-map-gl/mapbox'
import { useData, useExplorer } from '../ExplorerProvider'

export function NeighborhoodBaseLayer() {
  const data = useData()
  const { state } = useExplorer()

  if (!data.neighborhoods) return null

  const selectedId =
    state.selected?.type === 'neighborhood' ? state.selected.id : null
  const selectedNum = selectedId ? parseInt(selectedId, 10) : null

  const compareANum = state.compareNeighborhoodA
    ? parseInt(state.compareNeighborhoodA, 10)
    : null
  const compareBNum = state.compareNeighborhoodB
    ? parseInt(state.compareNeighborhoodB, 10)
    : null

  const isInCompareMode = state.compareMode

  const matchExpr: mapboxgl.Expression = [
    '==',
    ['get', 'NHD_NUM'],
    selectedNum ?? -1,
  ]

  const matchCompareA: mapboxgl.Expression = [
    '==',
    ['get', 'NHD_NUM'],
    compareANum ?? -1,
  ]

  const matchCompareB: mapboxgl.Expression = [
    '==',
    ['get', 'NHD_NUM'],
    compareBNum ?? -1,
  ]

  const isCompareSelected: mapboxgl.Expression = [
    'any',
    matchCompareA,
    matchCompareB,
  ]

  return (
    <Source
      id="neighborhood-base"
      type="geojson"
      data={data.neighborhoods as unknown as GeoJSON.GeoJSON}
    >
      <Layer
        id="neighborhood-base-fill"
        type="fill"
        beforeId="waterway-label"
        paint={{
          'fill-color': isInCompareMode
            ? [
                'case',
                matchCompareA,
                'rgba(59,130,246,0.25)',
                matchCompareB,
                'rgba(249,115,22,0.25)',
                matchExpr,
                'rgba(99,102,241,0.25)',
                'rgba(0,0,0,0.08)',
              ]
            : ['case', matchExpr, 'rgba(99,102,241,0.25)', 'transparent'],
          'fill-opacity': 0.5,
        }}
      />
      <Layer
        id="neighborhood-base-outline"
        type="line"
        paint={{
          'line-color': isInCompareMode
            ? [
                'case',
                matchCompareA,
                '#3b82f6',
                matchCompareB,
                '#f97316',
                matchExpr,
                '#6366f1',
                'rgba(0,0,0,0.12)',
              ]
            : ['case', matchExpr, '#6366f1', 'rgba(0,0,0,0.12)'],
          'line-width': isInCompareMode
            ? ['case', isCompareSelected, 3.5, matchExpr, 2.5, 0.5]
            : ['case', matchExpr, 2.5, 0.5],
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
          'text-color': 'rgba(0,0,0,0.55)',
          'text-halo-color': 'rgba(255,255,255,0.8)',
          'text-halo-width': 1.2,
        }}
      />
    </Source>
  )
}
