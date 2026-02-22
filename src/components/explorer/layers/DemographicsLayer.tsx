import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/mapbox'
import { useData, useExplorer } from '../ExplorerProvider'
import { DEMO_COLORS, dynamicBreaks } from '@/lib/colors'

export function DemographicsLayer() {
  const { state } = useExplorer()
  const data = useData()
  const metric = state.subToggles.demographicsMetric

  const choroplethGeo = useMemo(() => {
    if (!data.neighborhoods || !data.demographicsData) return null
    const features = data.neighborhoods.features.map((f) => {
      const nhdNum = String(f.properties.NHD_NUM).padStart(2, '0')
      const demo = data.demographicsData![nhdNum]
      let value = 0
      if (demo) {
        switch (metric) {
          case 'population':
            value = demo.population['2020'] ?? 0
            break
          case 'vacancyRate':
            value = demo.housing.vacancyRate
            break
          case 'popChange':
            value = demo.popChange10to20
            break
        }
      }
      return {
        ...f,
        properties: { ...f.properties, demoValue: value },
      }
    })
    return { type: 'FeatureCollection' as const, features }
  }, [data.neighborhoods, data.demographicsData, metric])

  const breaks = useMemo(() => {
    if (!choroplethGeo) return dynamicBreaks([])
    const values = choroplethGeo.features
      .map((f) => f.properties.demoValue)
      .filter((v) => v !== 0)
    return dynamicBreaks(values)
  }, [choroplethGeo])

  const fillColorExpr: mapboxgl.Expression = [
    'step',
    ['get', 'demoValue'],
    DEMO_COLORS[0],
    ...breaks.slice(1).flatMap((b, i) => [b, DEMO_COLORS[i + 1]]),
  ]

  if (!data.demographicsData || !data.neighborhoods) return null

  return (
    <>
      {choroplethGeo && (
        <Source id="demographics-choropleth" type="geojson" data={choroplethGeo}>
          <Layer
            id="demographics-choropleth-fill"
            type="fill"
            beforeId="waterway-label"
            paint={{
              'fill-color': fillColorExpr,
              'fill-opacity': 0.7,
            }}
          />
          <Layer
            id="demographics-choropleth-outline"
            type="line"
            beforeId="waterway-label"
            paint={{
              'line-color': 'rgba(0,0,0,0.15)',
              'line-width': 1,
            }}
          />
        </Source>
      )}

    </>
  )
}
