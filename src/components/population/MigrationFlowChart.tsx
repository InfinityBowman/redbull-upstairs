import { useState, useMemo } from 'react'
import {
  migrationFlows,
  type MigrationFlowRecord,
} from '@/lib/population-history'
import { cn } from '@/lib/utils'

type ViewMode = 'net' | 'domestic' | 'international'

export function MigrationFlowChart() {
  const [viewMode, setViewMode] = useState<ViewMode>('net')
  const [hoveredYear, setHoveredYear] = useState<MigrationFlowRecord | null>(
    null,
  )

  const data = migrationFlows

  const getValue = (d: MigrationFlowRecord) => {
    switch (viewMode) {
      case 'net':
        return d.totalNet
      case 'domestic':
        return d.domesticNet
      case 'international':
        return d.internationalNet
    }
  }

  const maxAbsValue = useMemo(() => {
    const values = data.map((d) => Math.abs(getValue(d)))
    return Math.max(...values)
  }, [data, viewMode])

  const getBarColor = (value: number) => {
    if (value > 0) return 'from-emerald-600 to-emerald-400'
    return 'from-red-600 to-red-400'
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold">Migration Flows</h3>
          <p className="text-[0.65rem] text-muted-foreground">
            Annual movement in/out of St. Louis City
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          {(['net', 'domestic', 'international'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'rounded px-2 py-0.5 text-[0.6rem] font-medium transition-colors capitalize',
                viewMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="relative" onMouseLeave={() => setHoveredYear(null)}>
        <div className="flex h-32 items-end justify-between gap-0.5">
          {data.map((d, i) => {
            const value = getValue(d)
            const height = (Math.abs(value) / maxAbsValue) * 100
            const isPositive = value > 0

            return (
              <div
                key={d.year}
                className="flex flex-1 flex-col items-center justify-end"
                onMouseEnter={() => setHoveredYear(d)}
              >
                {isPositive ? (
                  <div className="flex flex-col items-center">
                    <span className="text-[0.45rem] text-emerald-400 tabular-nums">
                      +{value.toLocaleString()}
                    </span>
                    <div
                      className={cn(
                        'w-full rounded-t bg-gradient-to-t',
                        getBarColor(value),
                      )}
                      style={{ height: `${height * 0.6}px` }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-full rounded-t bg-gradient-to-t',
                        getBarColor(value),
                      )}
                      style={{ height: `${height * 0.6}px` }}
                    />
                    <span className="text-[0.45rem] text-red-400 tabular-nums">
                      {value.toLocaleString()}
                    </span>
                  </div>
                )}
                {i % 3 === 0 && (
                  <span className="mt-0.5 text-[0.4rem] text-muted-foreground">
                    {d.year}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {hoveredYear && (
        <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2">
          <div className="mb-1 text-xs font-bold">{hoveredYear.year}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[0.65rem]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Domestic In:</span>
              <span className="text-emerald-400">
                +{hoveredYear.domesticIn.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Domestic Out:</span>
              <span className="text-red-400">
                -{hoveredYear.domesticOut.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Int'l In:</span>
              <span className="text-emerald-400">
                +{hoveredYear.internationalIn.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Int'l Out:</span>
              <span className="text-red-400">
                -{hoveredYear.internationalOut.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-2 flex justify-between border-t border-border/40 pt-1.5 text-[0.65rem] font-semibold">
            <span>Net Change:</span>
            <span
              className={
                hoveredYear.totalNet > 0 ? 'text-emerald-400' : 'text-red-400'
              }
            >
              {hoveredYear.totalNet > 0 ? '+' : ''}
              {hoveredYear.totalNet.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-emerald-500" />
            <span className="text-[0.55rem] text-muted-foreground">Inflow</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-red-500" />
            <span className="text-[0.55rem] text-muted-foreground">
              Outflow
            </span>
          </div>
        </div>
        <span className="text-[0.55rem] text-muted-foreground">
          IRS Migration Data
        </span>
      </div>
    </div>
  )
}
