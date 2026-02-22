import { useMemo, useState } from 'react'
import { priceDataset } from '@/lib/price-data'
import { cn } from '@/lib/utils'

interface HousingPriceHistoryChartProps {
  year: number
  selectedNeighborhood?: string | null
  onNeighborhoodSelect?: (name: string | null) => void
}

export function HousingPriceHistoryChart({
  year,
  selectedNeighborhood,
  onNeighborhoodSelect,
}: HousingPriceHistoryChartProps) {
  const [showRent, setShowRent] = useState(false)

  const allYears = useMemo(() => {
    const years = new Set<number>()
    priceDataset.forEach((n) => {
      n.history.forEach((h) => years.add(h.year))
    })
    return Array.from(years).sort((a: number, b: number) => a - b)
  }, [])

  const maxPrice = Math.max(
    ...priceDataset.flatMap(
      (n) => n.history.find((h) => h.year === year)?.price ?? 0,
    ),
  )

  const currentData = useMemo(() => {
    return priceDataset.map((n) => {
      const p = n.history.find((h) => h.year === year)
      return {
        id: n.id,
        name: n.name,
        price: p?.price ?? 0,
        rent: p?.rent ?? 0,
      }
    })
  }, [year])

  const handleNeighborhoodClick = (name: string) => {
    if (onNeighborhoodSelect) {
      onNeighborhoodSelect(selectedNeighborhood === name ? null : name)
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Price History
          </span>
          <button
            onClick={() => setShowRent(!showRent)}
            className={cn(
              'rounded px-2 py-0.5 text-xs font-medium transition-colors',
              showRent
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {showRent ? 'Rent' : 'Price'}
          </button>
        </div>
        <span className="text-xs text-muted-foreground">{year}</span>
      </div>

      <div className="mb-2 text-[0.55rem] text-muted-foreground">
        Click a neighborhood to highlight on map. Prices based on Redfin/Zillow
        data (2015-2025).
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
        {currentData.map((n) => {
          const neighborhoodData = priceDataset.find((p) => p.id === n.id)
          const isSelected = selectedNeighborhood === n.name

          return (
            <button
              key={n.id}
              onClick={() => handleNeighborhoodClick(n.name)}
              className={cn(
                'rounded-lg p-3 text-left transition-all',
                isSelected
                  ? 'bg-violet-500/20 ring-1 ring-violet-500/50'
                  : 'bg-muted/30 hover:bg-muted/50',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-foreground">
                  {n.name}
                </div>
                {isSelected && (
                  <span className="rounded bg-violet-500/30 px-1.5 py-0.5 text-[0.5rem] font-semibold text-violet-400">
                    Selected
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-sm font-bold tabular-nums text-amber-600">
                  ${(n.price / 1000).toFixed(0)}K
                </span>
                <span className="text-[0.6rem] text-muted-foreground">
                  ${n.rent.toLocaleString()}/mo
                </span>
              </div>

              {isSelected && neighborhoodData && (
                <div className="mt-2">
                  <svg width="100%" height="30" viewBox="0 0 200 30">
                    {allYears.map((y, i) => {
                      const pricePoint = neighborhoodData.history.find(
                        (h) => h.year === y,
                      )
                      const x = (i / (allYears.length - 1)) * 200
                      const height = ((pricePoint?.price ?? 0) / maxPrice) * 25
                      return (
                        <rect
                          key={y}
                          x={x}
                          y={30 - height}
                          width={200 / allYears.length - 2}
                          height={height}
                          fill="#f59e0b"
                          opacity={y === year ? 1 : 0.4}
                        />
                      )
                    })}
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        Hover over a neighborhood to see price trends over time.
      </div>
    </div>
  )
}
