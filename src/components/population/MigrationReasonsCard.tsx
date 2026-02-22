import { Card } from './Card'
import { leavingReasons } from '@/lib/migration-data'

const categoryColors = {
  education: 'bg-blue-500',
  safety: 'bg-red-500',
  housing: 'bg-purple-500',
  jobs: 'bg-emerald-500',
  taxes: 'bg-amber-500',
  services: 'bg-cyan-500',
}

const categoryLabels = {
  education: 'Education',
  safety: 'Safety',
  housing: 'Housing',
  jobs: 'Jobs',
  taxes: 'Taxes',
  services: 'Services',
}

export function MigrationReasonsCard() {
  const maxPercentage = Math.max(...leavingReasons.map((r) => r.percentage))

  return (
    <Card
      title="Why People Leave"
      subtitle="Survey of recent movers (2022-2024)"
      highlight="Schools #1"
      highlightLabel="Primary driver"
      accent="blue"
    >
      <div className="flex h-48 flex-col justify-between">
        {leavingReasons.slice(0, 6).map((reason) => {
          const width = (reason.percentage / maxPercentage) * 100
          return (
            <div key={reason.reason} className="flex items-center gap-2">
              <div className="w-28 shrink-0 truncate text-[0.6rem] text-muted-foreground">
                {reason.reason}
              </div>
              <div className="flex-1">
                <div className="relative h-4 rounded bg-muted/50">
                  <div
                    className={`absolute left-0 top-0 h-full rounded ${categoryColors[reason.category]}`}
                    style={{ width: `${width}%` }}
                  />
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[0.55rem] font-bold tabular-nums">
                    {reason.percentage}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(categoryLabels)
          .slice(0, 4)
          .map(([key, label]) => (
            <div key={key} className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-sm ${categoryColors[key as keyof typeof categoryColors]}`}
              />
              <span className="text-[0.5rem] text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
      </div>
    </Card>
  )
}
