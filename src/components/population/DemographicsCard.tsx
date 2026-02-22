import { Card } from './Card'
<<<<<<< HEAD

const vitalStats = [
  { year: 2015, births: 9850, deaths: 9200 },
  { year: 2016, births: 9400, deaths: 9350 },
  { year: 2017, births: 9100, deaths: 9500 },
  { year: 2018, births: 8800, deaths: 9650 },
  { year: 2019, births: 8600, deaths: 9800 },
  { year: 2020, births: 8200, deaths: 10200 },
  { year: 2021, births: 7900, deaths: 10500 },
  { year: 2022, births: 7700, deaths: 10700 },
  { year: 2023, births: 7500, deaths: 10800 },
  { year: 2024, births: 7300, deaths: 10900 },
]

const projections = [
  { year: 2025, births: 7100, deaths: 11000 },
  { year: 2026, births: 6900, deaths: 11100 },
  { year: 2027, births: 6700, deaths: 11200 },
  { year: 2028, births: 6500, deaths: 11300 },
  { year: 2029, births: 6200, deaths: 11400 },
]

export function DemographicsCard() {
  const maxValue = Math.max(
    ...vitalStats.map((d) => Math.max(d.births, d.deaths)),
  )
=======
import { annualMigration, householdIncomeByYear } from '@/lib/migration-data'

export function DemographicsCard() {
  const latestMigration = annualMigration[annualMigration.length - 1]
  const maxNetChange = Math.max(
    ...annualMigration.map((d) => Math.abs(d.netChange)),
  )
  const latestIncome = householdIncomeByYear[householdIncomeByYear.length - 1]
>>>>>>> 32296c2 (your commit message)

  return (
    <Card
      title="Demographics"
<<<<<<< HEAD
      subtitle="Demographic Winter"
      highlight="Natural Decrease"
      highlightLabel="Deaths exceed Births"
      accent="orange"
    >
      <div className="flex h-40 flex-col justify-end">
        <div className="relative flex h-32 items-end justify-between gap-0.5">
          {[...vitalStats, ...projections].map((d, i) => {
            const isProjection = i >= vitalStats.length
=======
      subtitle="Migration & Income Gap"
      highlight={`${latestMigration.netChange}`}
      highlightLabel="net change 2024"
      accent="orange"
    >
      <div className="flex h-40 flex-col justify-end">
        <div className="relative flex h-28 items-end justify-between gap-0.5">
          {annualMigration.map((d, i) => {
            const height = (Math.abs(d.netChange) / maxNetChange) * 100
            const isPositive = d.netChange > 0
>>>>>>> 32296c2 (your commit message)
            return (
              <div
                key={d.year}
                className="flex flex-1 flex-col items-center gap-0.5"
              >
<<<<<<< HEAD
                <div className="relative flex w-full gap-px">
                  <div
                    className={`w-1/2 rounded-t ${isProjection ? 'bg-emerald-400/40 border-t border-dashed border-emerald-400' : 'bg-gradient-to-t from-emerald-600 to-emerald-400'}`}
                    style={{ height: `${(d.births / maxValue) * 100}px` }}
                  />
                  <div
                    className={`w-1/2 rounded-t ${isProjection ? 'bg-red-400/40 border-t border-dashed border-red-400' : 'bg-gradient-to-t from-red-600 to-red-400'}`}
                    style={{ height: `${(d.deaths / maxValue) * 100}px` }}
                  />
                </div>
                {d.year % 2 === 0 && (
                  <span
                    className={`text-[0.5rem] ${isProjection ? 'text-orange-400' : 'text-muted-foreground'}`}
                  >
=======
                <div
                  className={`w-full rounded-t ${isPositive ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-gradient-to-t from-red-600 to-red-400'}`}
                  style={{ height: `${height}%` }}
                />
                {i % 2 === 0 && (
                  <span className="text-[0.5rem] text-muted-foreground">
>>>>>>> 32296c2 (your commit message)
                    {d.year}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
<<<<<<< HEAD
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-emerald-500" />
            <span className="text-[0.55rem] text-muted-foreground">Births</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-red-500" />
            <span className="text-[0.55rem] text-muted-foreground">Deaths</span>
          </div>
        </div>
        <div className="rounded bg-orange-500/20 px-2 py-0.5 text-[0.6rem] font-semibold text-orange-400">
          {'<'}20K births projected by 2029
=======
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-red-500/10 p-2 text-center">
          <div className="text-sm font-bold text-red-400">
            {latestMigration.domesticOutflow.toLocaleString()}
          </div>
          <div className="text-[0.5rem] text-muted-foreground">
            Domestic Out
          </div>
        </div>
        <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
          <div className="text-sm font-bold text-emerald-400">
            +{latestMigration.internationalInflow.toLocaleString()}
          </div>
          <div className="text-[0.5rem] text-muted-foreground">Int'l In</div>
        </div>
        <div className="rounded-lg bg-orange-500/10 p-2 text-center">
          <div className="text-sm font-bold text-orange-400">
            {latestMigration.netChange}
          </div>
          <div className="text-[0.5rem] text-muted-foreground">Net</div>
        </div>
      </div>
      <div className="mt-2 rounded-lg bg-orange-500/10 px-3 py-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[0.6rem] font-semibold text-orange-400">
              Income Gap Persists
            </div>
            <p className="text-[0.55rem] text-muted-foreground">
              City: ${latestIncome.city.toLocaleString()} vs Metro: $
              {latestIncome.metro.toLocaleString()}
            </p>
          </div>
          <div className="text-right text-[0.55rem] text-muted-foreground">
            {Math.round(
              ((latestIncome.metro - latestIncome.city) / latestIncome.metro) *
                100,
            )}
            % gap
          </div>
>>>>>>> 32296c2 (your commit message)
        </div>
      </div>
    </Card>
  )
}
