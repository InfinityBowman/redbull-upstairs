import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useData, useExplorer } from '../ExplorerProvider'
import { CHORO_COLORS, dynamicBreaks } from '@/lib/colors'
import { getHoodComplaintCount, buildHeatmapGeo } from '@/lib/analysis'

export function ComplaintsLayer() {
  const { state } = useExplorer()
  const data = useData()

  const mode = state.subToggles.complaintsMode
  const category = state.subToggles.complaintsCategory
  const timeStart = state.subToggles.timeRangeStart
  const timeEnd = state.subToggles.timeRangeEnd
  const timeActive = timeStart !== '' && timeEnd !== ''

  // Filter heatmap points by category and time range
  const filteredPoints = useMemo(() => {
    if (!data.csbData) return []
    let points = data.csbData.heatmapPoints
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
  }, [data.csbData, category, timeActive, timeStart, timeEnd])

  // Choropleth: color neighborhoods by complaint count
  const choroplethGeo = useMemo(() => {
    if (!data.neighborhoods || !data.csbData) return null

    if (timeActive) {
      // Count filtered points per NHD_NUM
      // CSB hood values are numeric ward IDs matching NHD_NUM (e.g. "14", "44")
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
          complaintCount: counts[String(f.properties.NHD_NUM).padStart(2, '0')] ?? 0,
        },
      }))
      return { type: 'FeatureCollection' as const, features }
    }

    // No time filter — use pre-aggregated counts
    const features = data.neighborhoods.features.map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        complaintCount: getHoodComplaintCount(
          data.csbData!,
          f.properties.NHD_NUM,
          category,
        ),
      },
    }))
    return { type: 'FeatureCollection' as const, features }
  }, [data.neighborhoods, data.csbData, category, timeActive, filteredPoints])

  const heatmapGeo = useMemo(() => buildHeatmapGeo(filteredPoints), [filteredPoints])

  const breaks = useMemo(() => {
    if (!choroplethGeo) return dynamicBreaks([])
    const counts = choroplethGeo.features
      .map((f) => f.properties.complaintCount)
      .filter((c) => c > 0)
    return dynamicBreaks(counts)
  }, [choroplethGeo])

  const fillColorExpr: mapboxgl.Expression = [
    'step',
    ['get', 'complaintCount'],
    CHORO_COLORS[0],
    ...breaks.slice(1).flatMap((b, i) => [b, CHORO_COLORS[i + 1]]),
  ]

  if (!data.csbData || !data.neighborhoods) return null

  return (
    <>
      {mode === 'choropleth' && choroplethGeo && (
        <Source id="complaints-choropleth" type="geojson" data={choroplethGeo}>
          <Layer
            id="complaints-choropleth-fill"
            type="fill"
            beforeId="waterway-label"
            paint={{
              'fill-color': fillColorExpr,
              'fill-opacity': 0.75,
            }}
          />
          <Layer
            id="complaints-choropleth-outline"
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
        <Source id="complaints-heatmap-source" type="geojson" data={heatmapGeo}>
          <Layer
            id="complaints-heatmap"
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
                '#1b3a5c',
                0.35,
                '#1a6b6a',
                0.5,
                '#2f9e4f',
                0.65,
                '#85c531',
                0.8,
                '#f5c542',
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
