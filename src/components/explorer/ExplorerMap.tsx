import { useCallback, useMemo, useRef, useEffect } from 'react'
import type { MapStyle } from '@/lib/explorer-types'
import { useData, useExplorer } from './ExplorerProvider'
import { NeighborhoodBaseLayer } from './layers/NeighborhoodBaseLayer'
import { ComplaintsLayer } from './layers/ComplaintsLayer'
import { TransitLayer } from './layers/TransitLayer'
import { VacancyLayer } from './layers/VacancyLayer'
import { FoodAccessLayer } from './layers/FoodAccessLayer'
import { CrimeLayer } from './layers/CrimeLayer'
import { DemographicsLayer } from './layers/DemographicsLayer'
import { CommunityVoiceLayer } from './layers/CommunityVoiceLayer'
import { TimeRangeSlider } from './TimeRangeSlider'
import { MapProvider } from '@/components/map/MapProvider'
import {
  MapLegend,
  GradientSection,
  SwatchSection,
  SymbolSection,
} from '@/components/map/MapLegend'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  CHORO_COLORS,
  CRIME_COLORS,
  DEMO_COLORS,
  percentileBreaks,
  vacancyLegendItems,
} from '@/lib/colors'

const MAP_STYLES: Record<MapStyle, string> = {
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  streets: 'mapbox://styles/mapbox/streets-v12',
}

const STYLE_LABELS: Record<MapStyle, string> = {
  light: 'Light',
  dark: 'Dark',
  satellite: 'Satellite',
  streets: 'Streets',
}

function MapStyleToggle() {
  const { state, dispatch } = useExplorer()

  return (
    <div className="absolute top-2.5 left-2.5 z-10 flex gap-0.5 rounded-md border border-border/60 bg-background/90 p-0.5 shadow-sm backdrop-blur-sm">
      {(Object.keys(MAP_STYLES) as MapStyle[]).map((style) => (
        <button
          key={style}
          onClick={() => dispatch({ type: 'SET_MAP_STYLE', style })}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            state.mapStyle === style
              ? 'bg-brand text-white'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {STYLE_LABELS[style]}
        </button>
      ))}
    </div>
  )
}

export function ExplorerMap() {
  const { state, dispatch } = useExplorer()
  const data = useData()

  // Use refs to always have current state in map event handlers
  const stateRef = useRef(state)
  const dispatchRef = useRef(dispatch)

  useEffect(() => {
    stateRef.current = state
    dispatchRef.current = dispatch
  }, [state, dispatch])

  const handleMapLoad = useCallback((map: mapboxgl.Map) => {
    // Unified click handler using queryRenderedFeatures
    map.on('click', (e) => {
      const point = e.point
      const currentState = stateRef.current
      const currentDispatch = dispatchRef.current

      // In compare mode, only handle neighborhood clicks for comparison
      if (currentState.compareMode) {
        const hoodFeatures = map
          .queryRenderedFeatures(point, {
            layers: ['neighborhood-base-fill'],
          })
          .filter(Boolean)
        if (hoodFeatures.length > 0) {
          const nhdNum = hoodFeatures[0].properties?.NHD_NUM
          if (nhdNum != null) {
            const hoodId = String(nhdNum).padStart(2, '0')
            // If A is empty, set A; else if B is empty, set B; else replace A
            if (!currentState.compareNeighborhoodA) {
              currentDispatch({
                type: 'SET_COMPARE_NEIGHBORHOOD',
                slot: 'A',
                id: hoodId,
              })
            } else if (!currentState.compareNeighborhoodB) {
              currentDispatch({
                type: 'SET_COMPARE_NEIGHBORHOOD',
                slot: 'B',
                id: hoodId,
              })
            } else {
              // Both filled - replace A
              currentDispatch({
                type: 'SET_COMPARE_NEIGHBORHOOD',
                slot: 'A',
                id: hoodId,
              })
            }
            return
          }
        }
        return
      }

      // 0. Community voice markers (check first - most specific)
      const voiceFeatures = map.getLayer('voice-circles')
        ? map.queryRenderedFeatures(point, { layers: ['voice-circles'] })
        : []
      if (voiceFeatures.length > 0) {
        const id = voiceFeatures[0].properties?.id
        if (id) {
          currentDispatch({
            type: 'SELECT_ENTITY',
            entity: { type: 'communityVoice', id: String(id) },
          })
          return
        }
      }

      // 1. Check vacancy markers first (most specific points)
      const vacancyFeatures = map.getLayer('vacancy-circles')
        ? map.queryRenderedFeatures(point, { layers: ['vacancy-circles'] })
        : []
      if (vacancyFeatures.length > 0) {
        const id = vacancyFeatures[0].properties?.id
        if (id != null) {
          currentDispatch({
            type: 'SELECT_ENTITY',
            entity: { type: 'vacancy', id: Number(id) },
          })
          return
        }
      }

      // 2. Transit stops
      const stopFeatures = map.getLayer('stops-circles')
        ? map.queryRenderedFeatures(point, { layers: ['stops-circles'] })
        : []
      if (stopFeatures.length > 0) {
        const id = stopFeatures[0].properties?.stop_id
        if (id) {
          currentDispatch({
            type: 'SELECT_ENTITY',
            entity: { type: 'stop', id: String(id) },
          })
          return
        }
      }

      // 3. Grocery stores
      const groceryFeatures = map.getLayer('grocery-circles')
        ? map.queryRenderedFeatures(point, { layers: ['grocery-circles'] })
        : []
      if (groceryFeatures.length > 0) {
        const idx = groceryFeatures[0].properties?.idx
        if (idx != null) {
          currentDispatch({
            type: 'SELECT_ENTITY',
            entity: { type: 'grocery', id: Number(idx) },
          })
          return
        }
      }

      // 4. Food desert tracts
      const desertFeatures = map.getLayer('desert-fill')
        ? map.queryRenderedFeatures(point, { layers: ['desert-fill'] })
        : []
      if (desertFeatures.length > 0) {
        const tractId = desertFeatures[0].properties?.tract_id
        if (tractId) {
          currentDispatch({
            type: 'SELECT_ENTITY',
            entity: { type: 'foodDesert', id: String(tractId) },
          })
          return
        }
      }

      // 5. Neighborhood polygons (also catches crime/demographics choropleth clicks)
      const hoodFeatures = map.getLayer('neighborhood-base-fill')
        ? map.queryRenderedFeatures(point, { layers: ['neighborhood-base-fill'] })
        : []
      if (hoodFeatures.length > 0) {
        const nhdNum = hoodFeatures[0].properties?.NHD_NUM
        if (nhdNum != null) {
          currentDispatch({
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
      currentDispatch({ type: 'CLEAR_SELECTION' })
    })

    // Pointer cursor on hover
    const interactiveLayers = [
      'voice-circles',
      'vacancy-circles',
      'stops-circles',
      'grocery-circles',
      'desert-fill',
      'neighborhood-base-fill',
    ]

    map.on('mousemove', (e) => {
      const activeLayers = interactiveLayers.filter((l) => map.getLayer(l))
      if (activeLayers.length === 0) return
      const features = map.queryRenderedFeatures(e.point, {
        layers: activeLayers,
      })
      map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : ''
    })
  }, [])

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

  const vacancyBreaks = useMemo(() => {
    if (!state.layers.vacancy || !data.vacancyData) return percentileBreaks([])
    return percentileBreaks(data.vacancyData.map((p) => p.triageScore))
  }, [state.layers.vacancy, data.vacancyData])

  const hasLegend =
    state.layers.complaints ||
    state.layers.crime ||
    state.layers.demographics ||
    state.layers.vacancy ||
    state.layers.foodAccess ||
    state.layers.transit

  return (
    <MapProvider
      className="h-full w-full"
      mapStyle={MAP_STYLES[state.mapStyle]}
      onMapLoad={handleMapLoad}
    >
      <MapStyleToggle />
      {data.neighborhoods && <NeighborhoodBaseLayer />}
      {state.layers.complaints && <ComplaintsLayer />}
      {state.layers.crime && <CrimeLayer />}
      {state.layers.transit && <TransitLayer />}
      {state.layers.vacancy && <VacancyLayer />}
      {state.layers.foodAccess && <FoodAccessLayer />}
      {state.layers.demographics && <DemographicsLayer />}
      {state.layers.communityVoice && <CommunityVoiceLayer />}

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
              <div>
                <div className="mb-1 flex items-center gap-1">
                  <span className="font-semibold text-foreground">
                    Vacancy Priority
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full bg-muted text-[0.55rem] font-bold leading-none text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                        ?
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      align="start"
                      className="w-56 rounded-lg bg-popover p-2.5 text-xs text-popover-foreground shadow-md ring-1 ring-foreground/10"
                      hideArrow
                    >
                      <p className="mb-1.5 font-semibold">
                        How priority is calculated
                      </p>
                      <p className="mb-1 text-muted-foreground">
                        Properties are ranked relative to each other using a
                        weighted score:
                      </p>
                      <ul className="space-y-0.5 text-muted-foreground">
                        <li>
                          <span className="font-medium text-foreground">
                            25%
                          </span>{' '}
                          Condition (violation severity)
                        </li>
                        <li>
                          <span className="font-medium text-foreground">
                            20%
                          </span>{' '}
                          Complaint density
                        </li>
                        <li>
                          <span className="font-medium text-foreground">
                            15%
                          </span>{' '}
                          Ownership (LRA/City/Private)
                        </li>
                        <li>
                          <span className="font-medium text-foreground">
                            15%
                          </span>{' '}
                          Tax delinquency
                        </li>
                        <li>
                          <span className="font-medium text-foreground">
                            15%
                          </span>{' '}
                          Proximity activity
                        </li>
                        <li>
                          <span className="font-medium text-foreground">
                            10%
                          </span>{' '}
                          Lot size
                        </li>
                      </ul>
                      <p className="mt-1.5 text-muted-foreground">
                        Colors show percentile rank — each band holds ~20% of
                        properties.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <SwatchSection items={vacancyLegendItems(vacancyBreaks)} />
              </div>
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
      <TimeRangeSlider />
    </MapProvider>
  )
}
