import { useMemo, useState } from 'react'
import { MapProvider } from '@/components/map/MapProvider'
import { HousingPriceLayer } from '@/components/explorer/layers/HousingPriceLayer'
import { StandaloneNeighborhoodLayer } from '@/components/explorer/layers/StandaloneNeighborhoodLayer'
import { HousingPriceHistoryChart } from './HousingPriceHistoryChart'
import { priceDataset } from '@/lib/price-data'
import { cn } from '@/lib/utils'

export function HousingPricesDashboard() {
  const [yearIndex, setYearIndex] = useState(
    priceDataset[0]?.history.length ? priceDataset[0].history.length - 1 : 0,
  )
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<
    string | null
  >(null)

  const years = useMemo(() => {
    const arr = priceDataset.flatMap((n) => n.history.map((h) => h.year))
    return Array.from(new Set(arr)).sort((a, b) => a - b)
  }, [])

  const currentYear = years[yearIndex] ?? years[years.length - 1]

  const priceRange = useMemo(() => {
    const prices = priceDataset.flatMap((n) => {
      const h = n.history.find((h) => h.year === currentYear)
      return h?.price ?? []
    })
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    }
  }, [currentYear])

  const prevYear = () => {
    if (yearIndex > 0) setYearIndex(yearIndex - 1)
  }
  const nextYear = () => {
    if (yearIndex < years.length - 1) setYearIndex(yearIndex + 1)
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b border-border/60 bg-card/60 px-4 py-2">
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Housing Prices
          </span>
          <div className="flex items-center gap-1 rounded-lg bg-muted/50 px-2 py-1">
            <button
              onClick={prevYear}
              disabled={yearIndex === 0}
              aria-label="Previous year"
              className={cn(
                'rounded px-2 py-0.5 text-sm transition-colors',
                yearIndex === 0
                  ? 'text-muted-foreground/50'
                  : 'hover:bg-muted text-foreground',
              )}
            >
              ‹
            </button>
            <span className="min-w-[50px] text-center text-sm font-bold tabular-nums">
              {currentYear}
            </span>
            <button
              onClick={nextYear}
              disabled={yearIndex === years.length - 1}
              aria-label="Next year"
              className={cn(
                'rounded px-2 py-0.5 text-sm transition-colors',
                yearIndex === years.length - 1
                  ? 'text-muted-foreground/50'
                  : 'hover:bg-muted text-foreground',
              )}
            >
              ›
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedNeighborhood && (
            <button
              onClick={() => setSelectedNeighborhood(null)}
              className="rounded bg-violet-500/20 px-2 py-0.5 text-xs text-violet-400 hover:bg-violet-500/30"
            >
              Clear: {selectedNeighborhood}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1">
        <div className="relative w-1/2 min-w-[320px] border-r border-border/60">
          <MapProvider className="h-full w-full">
            <StandaloneNeighborhoodLayer />
            <HousingPriceLayer
              year={currentYear}
              selectedNeighborhood={selectedNeighborhood}
            />
          </MapProvider>

          <div className="absolute bottom-4 left-4 rounded-lg border border-border/60 bg-card/95 p-3 backdrop-blur-sm">
            <div className="mb-1 text-[0.6rem] font-semibold uppercase text-muted-foreground">
              Median Price ({currentYear})
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-8 rounded bg-gradient-to-r from-amber-100 via-amber-400 to-amber-800" />
              <span className="text-[0.55rem] text-muted-foreground">
                ${(priceRange.min / 1000).toFixed(0)}K - $
                {(priceRange.max / 1000).toFixed(0)}K
              </span>
            </div>
          </div>
        </div>

        <div className="w-1/2 overflow-y-auto p-4">
          <HousingPriceHistoryChart
            year={currentYear}
            selectedNeighborhood={selectedNeighborhood}
            onNeighborhoodSelect={setSelectedNeighborhood}
          />
        </div>
      </div>
    </div>
  )
}
