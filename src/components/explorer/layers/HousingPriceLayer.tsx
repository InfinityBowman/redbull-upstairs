import { useEffect, useState } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { priceDataset } from '@/lib/price-data'

interface HousingPriceLayerProps {
  year: number
  selectedNeighborhood?: string | null
}

export function HousingPriceLayer({
  year,
  selectedNeighborhood,
}: HousingPriceLayerProps) {
  const [neighborhoods, setNeighborhoods] = useState<GeoJSON.GeoJSON | null>(
    null,
  )

  useEffect(() => {
    fetch('/data/neighborhoods.geojson')
      .then((res) => res.json())
      .then(setNeighborhoods)
      .catch(console.error)
  }, [])

  const features =
    neighborhoods && neighborhoods.type === 'FeatureCollection'
      ? (neighborhoods as GeoJSON.FeatureCollection).features.map((f) => {
          const props = f.properties as Record<string, unknown> | undefined
          const nhdNum = String(props?.NHD_NUM ?? '').padStart(2, '0')
          const nhdName = String(props?.NHD_NAME ?? '')
          const pricePoint = priceDataset.find((p) => p.id === nhdNum)
          const priceData = pricePoint?.history.find((h) => h.year === year)
          const price = priceData?.price ?? 0
          const rent = priceData?.rent ?? 0
          const isSelected =
            selectedNeighborhood?.toLowerCase() === nhdName.toLowerCase()

          return {
            type: 'Feature' as const,
            properties: {
              ...props,
              price,
              rent,
              NHD_NUM: nhdNum,
              isSelected,
            },
            geometry: f.geometry,
          }
        })
      : []

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features,
  }

  const prices = features
    .map((feat) => (feat.properties as { price?: number })?.price ?? 0)
    .filter((p: number) => p > 0)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 100000
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 500000

  const hasPrice: mapboxgl.Expression = ['>', ['get', 'price'], 0]

  return (
    <Source
      id="housing-price-neighborhoods"
      type="geojson"
      data={geojson as unknown as GeoJSON.GeoJSON}
    >
      <Layer
        id="housing-price-fill"
        type="fill"
        beforeId="waterway-label"
        paint={{
          'fill-color': [
            'case',
            ['get', 'isSelected'],
            'rgba(139, 92, 246, 0.7)',
            hasPrice,
            [
              'interpolate',
              ['linear'],
              ['get', 'price'],
              minPrice,
              '#fef3c7',
              minPrice + (maxPrice - minPrice) * 0.25,
              '#fcd34d',
              minPrice + (maxPrice - minPrice) * 0.5,
              '#f59e0b',
              minPrice + (maxPrice - minPrice) * 0.75,
              '#d97706',
              maxPrice,
              '#92400e',
            ],
            'rgba(200, 200, 200, 0.15)',
          ],
          'fill-opacity': 0.8,
        }}
      />
      <Layer
        id="housing-price-outline"
        type="line"
        paint={{
          'line-color': [
            'case',
            ['get', 'isSelected'],
            '#8b5cf6',
            hasPrice,
            'rgba(180, 83, 9, 0.5)',
            'rgba(150, 150, 150, 0.3)',
          ],
          'line-width': ['case', ['get', 'isSelected'], 3, 1],
        }}
      />
      <Layer
        id="housing-price-labels"
        type="symbol"
        layout={{
          'text-field': [
            'case',
            hasPrice,
            ['concat', '$', ['to-string', ['/', ['get', 'price'], 1000]], 'K'],
            '',
          ],
          'text-size': 9,
          'text-anchor': 'center',
          'text-allow-overlap': false,
        }}
        paint={{
          'text-color': 'rgba(0, 0, 0, 0.8)',
          'text-halo-color': 'rgba(255, 255, 255, 0.9)',
          'text-halo-width': 1.5,
        }}
      />
    </Source>
  )
}
