import { Card } from './Card'
<<<<<<< HEAD

const schoolAgeData = [
  { year: 2010, population: 87200 },
  { year: 2012, population: 81500 },
  { year: 2014, population: 74300 },
  { year: 2016, population: 72100 },
  { year: 2018, population: 69800 },
  { year: 2020, population: 68200 },
  { year: 2022, population: 65400 },
  { year: 2024, population: 65200 },
]

export function EducationCard() {
  const maxPop = Math.max(...schoolAgeData.map((d) => d.population))
  const minPop = Math.min(...schoolAgeData.map((d) => d.population))
  const decline = (((maxPop - minPop) / maxPop) * 100).toFixed(0)
=======
import {
  schoolEnrollmentDecline,
  cityVsCountyComparison,
} from '@/lib/migration-data'

export function EducationCard() {
  const maxTotal = Math.max(...schoolEnrollmentDecline.map((d) => d.total))
  const earliestTotal = schoolEnrollmentDecline[0].total
  const latestTotal =
    schoolEnrollmentDecline[schoolEnrollmentDecline.length - 1].total
  const decline = (
    ((earliestTotal - latestTotal) / earliestTotal) *
    100
  ).toFixed(0)
>>>>>>> 32296c2 (your commit message)

  return (
    <Card
      title="Education"
<<<<<<< HEAD
      subtitle="School-Age Population Decline"
=======
      subtitle="K-12 Enrollment Decline"
>>>>>>> 32296c2 (your commit message)
      highlight={`-${decline}%`}
      highlightLabel="since 2010"
      accent="blue"
    >
      <div className="flex h-40 flex-col justify-end">
        <div className="relative flex h-32 items-end justify-between gap-1">
<<<<<<< HEAD
          {schoolAgeData.map((d, i) => {
            const height = (d.population / maxPop) * 100
=======
          {schoolEnrollmentDecline.map((d, i) => {
>>>>>>> 32296c2 (your commit message)
            return (
              <div
                key={d.year}
                className="flex flex-1 flex-col items-center gap-1"
              >
<<<<<<< HEAD
                <div
                  className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 transition-all"
                  style={{ height: `${height}%` }}
                />
                {i % 2 === 0 && (
                  <span className="text-[0.55rem] text-muted-foreground">
=======
                <div className="relative w-full">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400"
                    style={{ height: `${(d.slps / maxTotal) * 80}px` }}
                  />
                  <div
                    className="absolute left-0 top-0 w-full rounded-t bg-gradient-to-t from-emerald-600/70 to-emerald-400/70"
                    style={{
                      height: `${((d.slps + d.charter) / maxTotal) * 80}px`,
                    }}
                  />
                </div>
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
      <div className="mt-3 rounded-lg bg-blue-500/10 px-3 py-2">
=======
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-blue-500" />
            <span className="text-[0.55rem] text-muted-foreground">SLPS</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-emerald-500" />
            <span className="text-[0.55rem] text-muted-foreground">
              Charter
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2 rounded-lg bg-blue-500/10 px-3 py-2">
>>>>>>> 32296c2 (your commit message)
        <div className="flex items-center gap-1.5 text-[0.65rem] font-semibold text-blue-400">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 5v2M8 10v1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
<<<<<<< HEAD
          Primary Driver: School District Boundaries
        </div>
        <p className="mt-1 text-[0.6rem] text-muted-foreground">
          Families with school-age children relocating to county districts for
          perceived better schools.
=======
          Primary Driver: School Ratings
        </div>
        <p className="mt-0.5 text-[0.55rem] text-muted-foreground">
          City schools average {cityVsCountyComparison.city.schoolRating}/10 vs
          county {cityVsCountyComparison.county.schoolRating}/10
>>>>>>> 32296c2 (your commit message)
        </p>
      </div>
    </Card>
  )
}
