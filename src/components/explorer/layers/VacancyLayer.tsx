import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useData, useExplorer } from '../ExplorerProvider'
import { VACANCY_COLORS, percentileBreaks } from '@/lib/colors'
import { filterVacancies } from '@/lib/analysis'

export function VacancyLayer() {
  const { state } = useExplorer()
  const data = useData()

  const filtered = useMemo(
    () => (data.vacancyData ? filterVacancies(data.vacancyData, state.subToggles) : []),
    [data.vacancyData, state.subToggles],
  )

  // Compute breaks from ALL data so colors stay stable when filtering
  const breaks = useMemo(
    () => percentileBreaks((data.vacancyData ?? []).map((p) => p.triageScore)),
    [data.vacancyData],
  )

  const markersGeo = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: filtered.map((p) => ({
        type: 'Feature' as const,
        properties: {
          id: p.id,
          score: p.triageScore,
          type: p.propertyType,
          address: p.address,
          bestUse: p.bestUse,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [p.lng, p.lat],
        },
      })),
    }),
    [filtered],
  )

  const colorExpr: mapboxgl.Expression = [
    'step',
    ['get', 'score'],
    VACANCY_COLORS[0],
    ...breaks.slice(1).flatMap((b, i) => [b, VACANCY_COLORS[i + 1]]),
  ]

  if (!data.vacancyData) return null

  return (
    <Source id="vacancies" type="geojson" data={markersGeo}>
      <Layer
        id="vacancy-circles"
        type="circle"
        paint={{
          'circle-radius': [
            'case',
            ['==', ['get', 'type'], 'building'],
            6,
            4,
          ],
          'circle-color': colorExpr,
          'circle-opacity': 0.85,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 0.5,
          'circle-stroke-opacity': 0.6,
        }}
      />
    </Source>
  )
}
