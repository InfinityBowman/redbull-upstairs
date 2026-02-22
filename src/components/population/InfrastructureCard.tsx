import { Card } from './Card'
<<<<<<< HEAD

const neighborhoods = [
  { name: 'Downtown', waitDays: 12, outflow: 'low', x: 50, y: 30 },
  { name: 'Central West End', waitDays: 8, outflow: 'low', x: 70, y: 25 },
  { name: 'Tower Grove S', waitDays: 15, outflow: 'medium', x: 55, y: 55 },
  { name: 'Grand Center', waitDays: 18, outflow: 'medium', x: 45, y: 35 },
  { name: 'North St. Louis', waitDays: 28, outflow: 'high', x: 40, y: 15 },
  { name: 'The Ville', waitDays: 24, outflow: 'high', x: 50, y: 20 },
  { name: 'Gravois Park', waitDays: 22, outflow: 'high', x: 50, y: 50 },
  { name: 'Carondelet', waitDays: 10, outflow: 'low', x: 55, y: 75 },
  { name: 'Baden', waitDays: 26, outflow: 'high', x: 60, y: 10 },
  { name: 'Dutchtown', waitDays: 20, outflow: 'medium', x: 55, y: 60 },
  { name: 'Shaw', waitDays: 11, outflow: 'low', x: 55, y: 45 },
  { name: 'Soulard', waitDays: 9, outflow: 'low', x: 60, y: 40 },
]

export function InfrastructureCard() {
  const highOutflow = neighborhoods.filter((n) => n.waitDays >= 20).length

  return (
    <Card
      title="Infrastructure"
      subtitle="311 Resolution Time Impact"
      highlight={`${highOutflow} areas`}
      highlightLabel="with 20+ day waits"
      accent="red"
    >
      <div className="relative h-40 overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" className="text-muted-foreground">
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {neighborhoods.map((n) => {
          const intensity = Math.min(n.waitDays / 30, 1)
          const color =
            n.outflow === 'high'
              ? `rgba(239, 68, 68, ${intensity * 0.8})`
              : n.outflow === 'medium'
                ? `rgba(251, 146, 60, ${intensity * 0.6})`
                : `rgba(34, 197, 94, ${intensity * 0.4})`

          return (
            <div
              key={n.name}
              className="absolute flex items-center justify-center"
              style={{
                left: `${n.x}%`,
                top: `${n.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: `${Math.max(8, n.waitDays)}px`,
                  height: `${Math.max(8, n.waitDays)}px`,
                  background: color,
                  boxShadow: `0 0 ${intensity * 15}px ${color}`,
                }}
              />
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-[0.55rem] text-muted-foreground">
              High outflow
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-[0.55rem] text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[0.55rem] text-muted-foreground">Low</span>
          </div>
        </div>
        <div className="rounded bg-red-500/20 px-2 py-0.5 text-[0.6rem] font-semibold text-red-400">
          Correlation detected
        </div>
      </div>
    </Card>
=======
import {
  vacancyHotspots,
  violentCrimeTrend,
  cityVsCountyComparison,
} from '@/lib/migration-data'
import { cn } from '@/lib/utils'

export function InfrastructureCard({ className }: { className?: string }) {
  const latestCrime = violentCrimeTrend[violentCrimeTrend.length - 1]
  const highVacancyHoods = vacancyHotspots.filter((v) => v.rate >= 30).length

  return (
    <div className={cn(className)}>
      <Card
        title="Push Factors"
        subtitle="Crime, Vacancy & Service Gaps"
        highlight={`${latestCrime.city}`}
        highlightLabel="violent crimes/100k"
        accent="red"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-2 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Crime Rate Comparison
            </div>
            <div className="flex h-24 items-end gap-4">
              <div className="flex flex-1 flex-col items-center">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-red-600 to-red-400"
                  style={{
                    height: `${(cityVsCountyComparison.city.crimeRate / 100) * 100}%`,
                  }}
                />
                <span className="mt-1 text-[0.55rem] font-semibold text-red-400">
                  {cityVsCountyComparison.city.crimeRate}
                </span>
                <span className="text-[0.5rem] text-muted-foreground">
                  City
                </span>
              </div>
              <div className="flex flex-1 flex-col items-center">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400"
                  style={{
                    height: `${(cityVsCountyComparison.county.crimeRate / 100) * 100}%`,
                  }}
                />
                <span className="mt-1 text-[0.55rem] font-semibold text-emerald-400">
                  {cityVsCountyComparison.county.crimeRate}
                </span>
                <span className="text-[0.5rem] text-muted-foreground">
                  County
                </span>
              </div>
              <div className="flex flex-1 flex-col items-center">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400"
                  style={{ height: `${(latestCrime.national / 100) * 100}%` }}
                />
                <span className="mt-1 text-[0.55rem] font-semibold text-blue-400">
                  {latestCrime.national}
                </span>
                <span className="text-[0.5rem] text-muted-foreground">
                  US Avg
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Vacancy Hotspots
            </div>
            <div className="flex flex-col gap-1">
              {vacancyHotspots.slice(0, 4).map((hood) => (
                <div
                  key={hood.neighborhood}
                  className="flex items-center gap-2"
                >
                  <span className="w-24 truncate text-[0.55rem]">
                    {hood.neighborhood}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 rounded bg-muted/50">
                      <div
                        className="h-full rounded bg-red-500"
                        style={{ width: `${hood.rate}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-right text-[0.55rem] tabular-nums text-red-400">
                    {hood.rate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-red-500/10 p-2 text-center">
            <div className="text-lg font-bold text-red-400">
              {cityVsCountyComparison.city.vacantProperties.toLocaleString()}
            </div>
            <div className="text-[0.5rem] text-muted-foreground">
              Vacant Properties
            </div>
          </div>
          <div className="rounded-lg bg-orange-500/10 p-2 text-center">
            <div className="text-lg font-bold text-orange-400">
              {cityVsCountyComparison.city.schoolRating}
            </div>
            <div className="text-[0.5rem] text-muted-foreground">
              Avg School Rating
            </div>
          </div>
          <div className="rounded-lg bg-purple-500/10 p-2 text-center">
            <div className="text-lg font-bold text-purple-400">
              {cityVsCountyComparison.city.propertyTaxRate}%
            </div>
            <div className="text-[0.5rem] text-muted-foreground">
              Property Tax Rate
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2">
          <div className="text-[0.6rem] font-semibold text-red-400">
            {highVacancyHoods} neighborhoods with 30%+ vacancy rate
          </div>
          <p className="mt-0.5 text-[0.55rem] text-muted-foreground">
            High vacancy correlates with slower 311 response times and increased
            domestic outflow.
          </p>
        </div>
      </Card>
    </div>
>>>>>>> 32296c2 (your commit message)
  )
}
