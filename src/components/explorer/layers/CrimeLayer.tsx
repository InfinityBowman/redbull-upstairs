import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useData, useExplorer } from '../ExplorerProvider'
import { CRIME_COLORS, dynamicBreaks } from '@/lib/colors'

export function CrimeLayer() {
  const { state } = useExplorer()
  const data = useData()

  const mode = state.subToggles.crimeMode
  const category = state.subToggles.crimeCategory

  // Choropleth: color neighborhoods by crime count
  const choroplethGeo = useMemo(() => {
    if (!data.neighborhoods || !data.crimeData) return null
    const features = data.neighborhoods.features.map((f) => {
      const nhdNum = String(f.properties.NHD_NUM).padStart(2, '0')
      const hood = data.crimeData!.neighborhoods[nhdNum]
      let count = 0
      if (hood) {
        if (category === 'all') {
          count = hood.total
        } else {
          count = hood.topOffenses?.[category] ?? 0
        }
      }
      return {
        ...f,
        properties: { ...f.properties, crimeCount: count },
      }
    })
    return { type: 'FeatureCollection' as const, features }
  }, [data.neighborhoods, data.crimeData, category])

  // Heatmap: individual incident points
  const heatmapGeo = useMemo(() => {
    if (!data.crimeData) return null
    let points = data.crimeData.heatmapPoints
    if (category !== 'all') {
      points = points.filter((p) => p[2] === category)
    }
    return {
      type: 'FeatureCollection' as const,
      features: points.map((p) => ({
        type: 'Feature' as const,
        properties: { weight: 0.6 },
        geometry: { type: 'Point' as const, coordinates: [p[1], p[0]] },
      })),
    }
  }, [data.crimeData, category])

  const breaks = useMemo(() => {
    if (!choroplethGeo) return dynamicBreaks([])
    const counts = choroplethGeo.features
      .map((f) => f.properties.crimeCount)
      .filter((c) => c > 0)
    return dynamicBreaks(counts)
  }, [choroplethGeo])

  const fillColorExpr: mapboxgl.Expression = [
    'step',
    ['get', 'crimeCount'],
    CRIME_COLORS[0],
    ...breaks.slice(1).flatMap((b, i) => [b, CRIME_COLORS[i + 1]]),
  ]

  if (!data.crimeData || !data.neighborhoods) return null

  return (
    <>
      {mode === 'choropleth' && choroplethGeo && (
        <Source id="crime-choropleth" type="geojson" data={choroplethGeo}>
          <Layer
            id="crime-choropleth-fill"
            type="fill"
            beforeId="waterway-label"
            paint={{
              'fill-color': fillColorExpr,
              'fill-opacity': 0.75,
            }}
          />
          <Layer
            id="crime-choropleth-outline"
            type="line"
            beforeId="waterway-label"
            paint={{
              'line-color': 'rgba(0,0,0,0.15)',
              'line-width': 1,
            }}
          />
        </Source>
      )}

      {mode === 'heatmap' && heatmapGeo && (
        <Source id="crime-heatmap-source" type="geojson" data={heatmapGeo}>
          <Layer
            id="crime-heatmap"
            type="heatmap"
            beforeId="waterway-label"
            paint={{
              'heatmap-radius': 8,
              'heatmap-opacity': 0.8,
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'transparent',
                0.15,
                '#4a1942',
                0.35,
                '#7a1b3a',
                0.5,
                '#a8332b',
                0.65,
                '#d4601a',
                0.8,
                '#f5a623',
                1,
                '#f94144',
              ],
            }}
          />
        </Source>
      )}

    </>
  )
}
