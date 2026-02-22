import { Card } from './Card'
import { topDestinations, annualMigration } from '@/lib/migration-data'

export function DestinationsCard() {
  const maxMovers = Math.max(...topDestinations.map((d) => d.movers))
  const latestYear = annualMigration[annualMigration.length - 1]

  return (
    <Card
      title="Where They Go"
      subtitle="Top destination counties"
      highlight={`${latestYear.netChange}`}
      highlightLabel="Net change 2024"
      accent="orange"
    >
      <div className="flex flex-col gap-2">
        {topDestinations.map((dest, i) => {
          const width = (dest.movers / maxMovers) * 100
          return (
            <div key={dest.destination} className="flex items-center gap-2">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-orange-500/20 text-[0.55rem] font-bold text-orange-400">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="truncate text-[0.6rem] font-medium">
                    {dest.destination}
                  </span>
                  <span className="text-[0.55rem] tabular-nums text-muted-foreground">
                    {dest.movers.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded bg-muted/50">
                  <div
                    className="h-full rounded bg-gradient-to-r from-orange-500 to-orange-400"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
              <span className="w-8 text-right text-[0.55rem] text-muted-foreground">
                {dest.percentage}%
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 rounded-lg bg-orange-500/10 px-3 py-2">
        <div className="text-[0.6rem] font-semibold text-orange-400">
          52% move to St. Louis County alone
        </div>
        <p className="mt-0.5 text-[0.55rem] text-muted-foreground">
          Most common: better schools, lower crime, larger lots
        </p>
      </div>
    </Card>
  )
}
