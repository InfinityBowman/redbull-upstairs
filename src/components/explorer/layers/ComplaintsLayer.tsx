import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useData, useExplorer } from '../ExplorerProvider'
import { MapLegend } from '@/components/map/MapLegend'
import { CHORO_COLORS, dynamicBreaks } from '@/lib/colors'
import { getHoodComplaintCount } from '@/lib/analysis'

export function ComplaintsLayer() {
  const { state } = useExplorer()
  const data = useData()

  const mode = state.subToggles.complaintsMode
  const category = state.subToggles.complaintsCategory

  // Choropleth GeoJSON
  const choroplethGeo = useMemo(() => {
    if (!data.neighborhoods || !data.csbData) return null
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
  }, [data.neighborhoods, data.csbData, category])

  // Heatmap GeoJSON
  const heatmapGeo = useMemo(() => {
    if (!data.csbData) return null
    let points = data.csbData.heatmapPoints
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
  }, [data.csbData, category])

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

      <MapLegend
        title={
          mode === 'choropleth'
            ? category === 'all'
              ? '311 Complaints'
              : category
            : 'Complaint Density'
        }
        gradient
      />
    </>
  )
}
