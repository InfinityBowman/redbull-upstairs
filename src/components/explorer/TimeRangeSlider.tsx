import { useCallback, useEffect, useMemo } from 'react'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useData, useExplorer } from './ExplorerProvider'
import { cn } from '@/lib/utils'

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function TimeRangeSlider() {
  const { state, dispatch } = useExplorer()
  const data = useData()

  const showComplaints = state.layers.complaints
  const showCrime = state.layers.crime
  const visible = showComplaints || showCrime

  // Collect all heatmap points to derive available years
  const allPoints = useMemo(() => {
    if (!visible) return []
    return [
      ...(showComplaints && data.csbData ? data.csbData.heatmapPoints : []),
      ...(showCrime && data.crimeData ? data.crimeData.heatmapPoints : []),
    ]
  }, [visible, showComplaints, showCrime, data.csbData, data.crimeData])

  // Derive unique sorted years from data
  const historicalYears = useMemo(() => {
    const ys = new Set<number>()
    for (const p of allPoints) {
      const d = p[3]
      if (d) ys.add(Number(d.slice(0, 4)))
    }
    return Array.from(ys).sort((a, b) => a - b)
  }, [allPoints])

  // Extend years into future for forecasting
  const years = useMemo(() => {
    if (historicalYears.length === 0) return []
    const lastYear = historicalYears[historicalYears.length - 1]
    const forecastYears = state.subToggles.forecastMode
      ? [lastYear + 1, lastYear + 2, lastYear + 3]
      : []
    return [...historicalYears, ...forecastYears]
  }, [historicalYears, state.subToggles.forecastMode])

  // Default to latest year when layers change
  useEffect(() => {
    if (historicalYears.length > 0) {
      const latestYear = historicalYears[historicalYears.length - 1]
      dispatch({
        type: 'SET_SUB_TOGGLE',
        key: 'timeRangeStart',
        value: `${latestYear}-01-01`,
      })
      dispatch({
        type: 'SET_SUB_TOGGLE',
        key: 'timeRangeEnd',
        value: `${latestYear}-12-31`,
      })
      dispatch({
        type: 'SET_SUB_TOGGLE',
        key: 'forecastYear',
        value: latestYear,
      })
    }
  }, [historicalYears, dispatch, showComplaints, showCrime])

  const selectedYear = useMemo(() => {
    const { timeRangeStart } = state.subToggles
    if (!timeRangeStart) return years[years.length - 1] ?? null
    return Number(timeRangeStart.slice(0, 4))
  }, [state.subToggles.timeRangeStart, years])

  const handleYearChange = useCallback(
    (values: number[]) => {
      if (years.length === 0) return
      const idx = clamp(values[0], 0, years.length - 1)
      const year = years[idx]
      dispatch({
        type: 'SET_SUB_TOGGLE',
        key: 'timeRangeStart',
        value: `${year}-01-01`,
      })
      dispatch({
        type: 'SET_SUB_TOGGLE',
        key: 'timeRangeEnd',
        value: `${year}-12-31`,
      })
      dispatch({ type: 'SET_SUB_TOGGLE', key: 'forecastYear', value: year })
    },
    [years, dispatch],
  )

  const toggleForecast = useCallback(() => {
    dispatch({
      type: 'SET_SUB_TOGGLE',
      key: 'forecastMode',
      value: !state.subToggles.forecastMode,
    })
  }, [dispatch, state.subToggles.forecastMode])

  if (!visible || years.length < 2) return null

  const yearIdx =
    selectedYear != null ? years.indexOf(selectedYear) : years.length - 1
  const safeIdx = yearIdx >= 0 ? yearIdx : years.length - 1
  const isForecastYear =
    selectedYear != null &&
    historicalYears.length > 0 &&
    selectedYear > historicalYears[historicalYears.length - 1]

  return (
    <div
      className="absolute bottom-3 left-3 z-10 w-[min(400px,calc(100%-6rem))] rounded-xl border border-border/60 bg-background/90 px-3 py-1.5 shadow-lg backdrop-blur-md"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
          Year
          <Tooltip>
            <TooltipTrigger asChild>
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                className="cursor-help text-muted-foreground/50 transition-colors hover:text-muted-foreground"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 7v4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="5" r="0.75" fill="currentColor" />
              </svg>
            </TooltipTrigger>
<<<<<<< HEAD
            <TooltipContent side="top" className="max-w-[200px] text-center text-xs">
              Filters 311 Complaints and Crime heatmap layers by year. Enable Forecast to predict future trends.
=======
            <TooltipContent
              side="top"
              className="max-w-[200px] text-center text-xs"
            >
              Filters 311 Complaints and Crime heatmap layers by year. Enable
              Forecast to predict future trends.
>>>>>>> 32296c2 (your commit message)
            </TooltipContent>
          </Tooltip>
        </span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-[0.65rem] font-semibold tabular-nums',
              isForecastYear && 'text-orange-500',
            )}
          >
            {selectedYear ?? years[years.length - 1]}
            {isForecastYear && ' (forecast)'}
          </span>
        </div>
      </div>

      <Slider
        min={0}
        max={years.length - 1}
        step={1}
        value={[safeIdx]}
        onValueChange={handleYearChange}
        className={cn(
          isForecastYear &&
            '[&_[data-radix-slider-track]]:bg-gradient-to-r [&_[data-radix-slider-track]]:from-primary [&_[data-radix-slider-track]]:to-orange-400',
        )}
      />

<<<<<<< HEAD
      <div className="mt-0.5 flex select-none items-center justify-between px-[7px] text-[0.55rem] text-muted-foreground">
        {years.map((y, i) => (
          <div key={y} className="flex w-0 justify-center">
            {i === 0 || i === years.length - 1 ? (
              <span
                className={cn(
                  'whitespace-nowrap',
                  y > (historicalYears[historicalYears.length - 1] ?? 0) &&
                    'text-orange-500',
                )}
              >
                {y}
              </span>
            ) : (
              <span
                className={cn(
                  'h-1.5 w-px',
                  y > (historicalYears[historicalYears.length - 1] ?? 0)
                    ? 'bg-orange-400/50'
                    : 'bg-muted-foreground/30',
                )}
              />
            )}
          </div>
        ))}
=======
      <div className="mt-1 flex select-none items-center justify-between">
        <div className="flex w-0 justify-center px-[7px] text-[0.55rem] text-muted-foreground">
          {years.map((y, i) => (
            <div key={y} className="flex w-0 justify-center">
              {i === 0 || i === years.length - 1 ? (
                <span
                  className={cn(
                    'whitespace-nowrap',
                    y > (historicalYears[historicalYears.length - 1] ?? 0) &&
                      'text-orange-500',
                  )}
                >
                  {y}
                </span>
              ) : (
                <span
                  className={cn(
                    'h-1.5 w-px',
                    y > (historicalYears[historicalYears.length - 1] ?? 0)
                      ? 'bg-orange-400/50'
                      : 'bg-muted-foreground/30',
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Forecast toggle */}
      <div className="mt-1.5 flex items-center justify-end">
        <button
          onClick={toggleForecast}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.55rem] font-medium transition-colors',
            state.subToggles.forecastMode
              ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            className={cn(state.subToggles.forecastMode && 'animate-pulse')}
          >
            <path
              d="M8 2L14 8L8 14L2 8L8 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
          Predictive Forecast
        </button>
>>>>>>> 32296c2 (your commit message)
      </div>
    </div>
  )
}
