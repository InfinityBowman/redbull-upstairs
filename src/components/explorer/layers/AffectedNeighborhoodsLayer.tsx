import { Layer, Source } from 'react-map-gl/mapbox'
import { useData } from '../ExplorerProvider'
import { vacancyHotspots } from '@/lib/migration-data'

interface AffectedNeighborhoodsLayerProps {
  selectedNeighborhood: string | null
}

export function AffectedNeighborhoodsLayer({
  selectedNeighborhood,
}: AffectedNeighborhoodsLayerProps) {
  const data = useData()

  if (!data.neighborhoods) return null

  const affectedNames = vacancyHotspots.map((v) => v.neighborhood.toLowerCase())

  const selectedName = selectedNeighborhood?.toLowerCase()

  const isSelected: mapboxgl.Expression = [
    '==',
    ['downcase', ['get', 'NHD_NAME']],
    selectedName ?? '',
  ]

  const isAffected: mapboxgl.Expression = [
    'in',
    ['downcase', ['get', 'NHD_NAME']],
    ['literal', affectedNames],
  ]

  return (
    <Source
      id="affected-neighborhoods"
      type="geojson"
      data={data.neighborhoods as unknown as GeoJSON.GeoJSON}
    >
      <Layer
        id="affected-fill"
        type="fill"
        beforeId="waterway-label"
        paint={{
          'fill-color': [
            'case',
            isSelected,
            'rgba(239, 68, 68, 0.6)',
            isAffected,
            'rgba(239, 68, 68, 0.35)',
            'rgba(0, 0, 0, 0.08)',
          ],
          'fill-opacity': 0.8,
        }}
      />
      <Layer
        id="affected-outline"
        type="line"
        paint={{
          'line-color': [
            'case',
            isSelected,
            '#ef4444',
            isAffected,
            'rgba(239, 68, 68, 0.7)',
            'rgba(0, 0, 0, 0.15)',
          ],
          'line-width': ['case', isSelected, 3, isAffected, 2, 0.5],
        }}
      />
      <Layer
        id="affected-labels"
        type="symbol"
        layout={{
          'text-field': ['get', 'NHD_NAME'],
          'text-size': 10,
          'text-anchor': 'center',
          'text-allow-overlap': false,
        }}
        paint={{
          'text-color': [
            'case',
            isSelected,
            '#ffffff',
            isAffected,
            'rgba(255, 255, 255, 0.9)',
            'rgba(0, 0, 0, 0.4)',
          ],
          'text-halo-color': 'rgba(0, 0, 0, 0.8)',
          'text-halo-width': 1,
        }}
        filter={[
          'in',
          ['downcase', ['get', 'NHD_NAME']],
          ['literal', affectedNames],
        ]}
      />
    </Source>
  )
}
