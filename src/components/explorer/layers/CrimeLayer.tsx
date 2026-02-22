import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useData, useExplorer } from '../ExplorerProvider'
import { CRIME_COLORS, dynamicBreaks } from '@/lib/colors'
import { buildHeatmapGeo } from '@/lib/analysis'

export function CrimeLayer() {
  const { state } = useExplorer()
  const data = useData()

  const mode = state.subToggles.crimeMode
  const category = state.subToggles.crimeCategory
  const timeStart = state.subToggles.timeRangeStart
  const timeEnd = state.subToggles.timeRangeEnd
  const timeActive = timeStart !== '' && timeEnd !== ''

  // Filter heatmap points by category and time range
  const filteredPoints = useMemo(() => {
    if (!data.crimeData) return []
    let points = data.crimeData.heatmapPoints
    if (category !== 'all') {
      points = points.filter((p) => p[2] === category)
    }
    if (timeActive) {
      points = points.filter((p) => {
        const d = p[3]
        return d ? d >= timeStart && d <= timeEnd : false
      })
    }
    return points
  }, [data.crimeData, category, timeActive, timeStart, timeEnd])

  // Choropleth: color neighborhoods by crime count
  const choroplethGeo = useMemo(() => {
    if (!data.neighborhoods || !data.crimeData) return null

    if (timeActive) {
      // Count filtered points per NHD_NUM (heatmap stores zero-padded NHD_NUM)
      const counts: Record<string, number> = {}
      for (const p of filteredPoints) {
        const hood = p[4]
        if (!hood) continue
        const num = String(hood).padStart(2, '0')
        counts[num] = (counts[num] ?? 0) + 1
      }
      const features = data.neighborhoods.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          crimeCount: counts[String(f.properties.NHD_NUM).padStart(2, '0')] ?? 0,
        },
      }))
      return { type: 'FeatureCollection' as const, features }
    }

    // No time filter — use pre-aggregated counts
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
  }, [data.neighborhoods, data.crimeData, category, timeActive, filteredPoints])

  const heatmapGeo = useMemo(() => buildHeatmapGeo(filteredPoints), [filteredPoints])

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
