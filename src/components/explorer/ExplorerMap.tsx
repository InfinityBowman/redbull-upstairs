import { useCallback, useMemo } from 'react'
import { useData, useExplorer } from './ExplorerProvider'
import { NeighborhoodBaseLayer } from './layers/NeighborhoodBaseLayer'
import { ComplaintsLayer } from './layers/ComplaintsLayer'
import { TransitLayer } from './layers/TransitLayer'
import { VacancyLayer } from './layers/VacancyLayer'
import { FoodAccessLayer } from './layers/FoodAccessLayer'
import { CrimeLayer } from './layers/CrimeLayer'
import { DemographicsLayer } from './layers/DemographicsLayer'
import { MapProvider } from '@/components/map/MapProvider'
import {
  MapLegend,
  GradientSection,
  SwatchSection,
  SymbolSection,
} from '@/components/map/MapLegend'
import {
  CHORO_COLORS,
  CRIME_COLORS,
  DEMO_COLORS,
  VACANCY_SCORE_ITEMS,
} from '@/lib/colors'

export function ExplorerMap() {
  const { state, dispatch } = useExplorer()
  const data = useData()

  const handleMapLoad = useCallback(
    (map: mapboxgl.Map) => {
      // Unified click handler using queryRenderedFeatures
      map.on('click', (e) => {
        const point = e.point

        // 1. Check vacancy markers first (most specific points)
        const vacancyFeatures = map
          .queryRenderedFeatures(point, { layers: ['vacancy-circles'] })
          .filter(Boolean)
        if (vacancyFeatures.length > 0) {
          const id = vacancyFeatures[0].properties?.id
          if (id != null) {
            dispatch({
              type: 'SELECT_ENTITY',
              entity: { type: 'vacancy', id: Number(id) },
            })
            return
          }
        }

        // 2. Transit stops
        const stopFeatures = map
          .queryRenderedFeatures(point, { layers: ['stops-circles'] })
          .filter(Boolean)
        if (stopFeatures.length > 0) {
          const id = stopFeatures[0].properties?.stop_id
          if (id) {
            dispatch({
              type: 'SELECT_ENTITY',
              entity: { type: 'stop', id: String(id) },
            })
            return
          }
        }

        // 3. Grocery stores
        const groceryFeatures = map
          .queryRenderedFeatures(point, { layers: ['grocery-circles'] })
          .filter(Boolean)
        if (groceryFeatures.length > 0) {
          const idx = groceryFeatures[0].properties?.idx
          if (idx != null) {
            dispatch({
              type: 'SELECT_ENTITY',
              entity: { type: 'grocery', id: Number(idx) },
            })
            return
          }
        }

        // 4. Food desert tracts
        const desertFeatures = map
          .queryRenderedFeatures(point, { layers: ['desert-fill'] })
          .filter(Boolean)
        if (desertFeatures.length > 0) {
          const tractId = desertFeatures[0].properties?.tract_id
          if (tractId) {
            dispatch({
              type: 'SELECT_ENTITY',
              entity: { type: 'foodDesert', id: String(tractId) },
            })
            return
          }
        }

        // 5. Neighborhood polygons (also catches crime/demographics choropleth clicks)
        const hoodFeatures = map
          .queryRenderedFeatures(point, { layers: ['neighborhood-base-fill'] })
          .filter(Boolean)
        if (hoodFeatures.length > 0) {
          const nhdNum = hoodFeatures[0].properties?.NHD_NUM
          if (nhdNum != null) {
            dispatch({
              type: 'SELECT_ENTITY',
              entity: {
                type: 'neighborhood',
                id: String(nhdNum).padStart(2, '0'),
              },
            })
            return
          }
        }

        // Empty space — clear
        dispatch({ type: 'CLEAR_SELECTION' })
      })

      // Pointer cursor on hover
      const interactiveLayers = [
        'vacancy-circles',
        'stops-circles',
        'grocery-circles',
        'desert-fill',
        'neighborhood-base-fill',
      ]

      map.on('mousemove', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: interactiveLayers,
        })
        map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : ''
      })
    },
    [dispatch],
  )

  const complaintsTitle = useMemo(() => {
    if (!state.layers.complaints) return ''
    const { complaintsMode, complaintsCategory } = state.subToggles
    if (complaintsMode === 'heatmap') return 'Complaint Density'
    return complaintsCategory === 'all' ? '311 Complaints' : complaintsCategory
  }, [state.layers.complaints, state.subToggles])

  const crimeTitle = useMemo(() => {
    if (!state.layers.crime) return ''
    const { crimeMode, crimeCategory } = state.subToggles
    if (crimeMode === 'heatmap') return 'Crime Density'
    return crimeCategory === 'all' ? 'Crime Incidents' : crimeCategory
  }, [state.layers.crime, state.subToggles])

  const demoTitle = useMemo(() => {
    if (!state.layers.demographics) return ''
    const titles: Record<string, string> = {
      population: 'Population (2020)',
      vacancyRate: 'Vacancy Rate %',
      popChange: 'Pop Change %',
    }
    return titles[state.subToggles.demographicsMetric] ?? 'Demographics'
  }, [state.layers.demographics, state.subToggles.demographicsMetric])

  const hasLegend =
    state.layers.complaints ||
    state.layers.crime ||
    state.layers.demographics ||
    state.layers.vacancy ||
    state.layers.foodAccess ||
    state.layers.transit

  return (
    <MapProvider className="h-full w-full" onMapLoad={handleMapLoad}>
      {data.neighborhoods && <NeighborhoodBaseLayer />}
      {state.layers.complaints && <ComplaintsLayer />}
      {state.layers.crime && <CrimeLayer />}
      {state.layers.transit && <TransitLayer />}
      {state.layers.vacancy && <VacancyLayer />}
      {state.layers.foodAccess && <FoodAccessLayer />}
      {state.layers.demographics && <DemographicsLayer />}

      {hasLegend && (
        <MapLegend>
          {state.layers.complaints && (
            <GradientSection title={complaintsTitle} colors={CHORO_COLORS} />
          )}
          {state.layers.crime && (
            <GradientSection title={crimeTitle} colors={CRIME_COLORS} />
          )}
          {state.layers.demographics && (
            <GradientSection title={demoTitle} colors={DEMO_COLORS} />
          )}
          {state.layers.vacancy && (
            <>
              <SwatchSection title="Vacancy Triage" items={VACANCY_SCORE_ITEMS} />
              <SymbolSection
                title="Type"
                items={[
                  {
                    node: (
                      <span className="inline-block h-3 w-3 rounded-full border border-black/15 bg-muted-foreground/50" />
                    ),
                    label: 'Building',
                  },
                  {
                    node: (
                      <span className="inline-block h-2 w-2 rounded-full border border-black/15 bg-muted-foreground/50" />
                    ),
                    label: 'Lot',
                  },
                ]}
              />
            </>
          )}
          {state.layers.foodAccess && (
            <SwatchSection
              title="Food Access"
              items={[
                { color: '#ef4444', label: 'LILA Tract' },
                { color: '#059669', label: 'Grocery Store' },
              ]}
            />
          )}
          {state.layers.transit && (
            <>
              <SwatchSection
                title="Transit"
                items={[
                  { color: '#60a5fa', label: 'Stops' },
                  { color: '#a78bfa', label: 'Routes' },
                ]}
              />
              <SymbolSection
                title="Stop Activity"
                items={[
                  {
                    node: (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
                    ),
                    label: 'Few',
                  },
                  {
                    node: (
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" />
                    ),
                    label: 'Many',
                  },
                ]}
              />
            </>
          )}
        </MapLegend>
      )}
    </MapProvider>
  )
}
