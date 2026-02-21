import { useMemo } from 'react'
import { useData } from '../ExplorerProvider'
import { scoreColor } from '@/lib/colors'
import { cn } from '@/lib/utils'

const useLabels: Record<string, string> = {
  housing: 'Affordable Housing',
  solar: 'Solar Installation',
  garden: 'Community Garden',
}

const conditionLabels: Record<number, string> = {
  1: 'Condemned',
  2: 'Poor',
  3: 'Fair',
  4: 'Good',
  5: 'Excellent',
}

const ownerLabels: Record<string, string> = {
  LRA: 'Land Reutilization Authority',
  CITY: 'City of St. Louis',
  PRIVATE: 'Private Owner',
}

export function VacancyDetail({ id }: { id: number }) {
  const data = useData()

  const property = useMemo(
    () => data.vacancyData?.find((p) => p.id === id) ?? null,
    [data.vacancyData, id],
  )

  if (!property) {
    return (
      <div className="text-xs text-muted-foreground">Property not found</div>
    )
  }

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="text-base font-bold">{property.address}</div>
      <DetailRow label="Neighborhood" value={property.neighborhood} />
      <DetailRow label="Parcel ID" value={property.parcelId} />
      <DetailRow
        label="Type"
        value={
          property.propertyType === 'building'
            ? 'Vacant Building'
            : 'Vacant Lot'
        }
      />
      <DetailRow
        label="Condition"
        value={
          conditionLabels[property.conditionRating] ||
          String(property.conditionRating)
        }
      />
      {property.propertyType === 'building' && (
        <>
          <DetailRow label="Year Built" value={String(property.yearBuilt)} />
          <DetailRow label="Stories" value={String(property.stories)} />
          <DetailRow label="Board-Up" value={property.boardUpStatus} />
        </>
      )}
      <DetailRow
        label="Lot Size"
        value={`${property.lotSqFt.toLocaleString()} sq ft`}
      />
      <DetailRow label="Zoning" value={property.zoning} />
      <DetailRow label="Owner" value={ownerLabels[property.owner]} />
      <DetailRow
        label="Tax Delinquent"
        value={`${property.taxYearsDelinquent} yr${property.taxYearsDelinquent !== 1 ? 's' : ''}`}
      />
      <DetailRow label="Violations" value={String(property.violationCount)} />
      <DetailRow
        label="311 Complaints"
        value={`${property.complaintsNearby} nearby`}
      />
      <DetailRow
        label="Assessed Value"
        value={`$${property.assessedValue.toLocaleString()}`}
      />

      <div className="flex items-center justify-between border-b border-border py-1">
        <span className="text-muted-foreground">Triage Score</span>
        <span
          className="text-sm font-bold"
          style={{ color: scoreColor(property.triageScore) }}
        >
          {property.triageScore}/100
        </span>
      </div>

      <span
        className={cn(
          'inline-block self-start rounded-full px-3 py-1 text-xs font-bold',
          property.bestUse === 'housing' &&
            'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
          property.bestUse === 'solar' &&
            'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
          property.bestUse === 'garden' &&
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
        )}
      >
        {useLabels[property.bestUse]}
      </span>

      {/* Score breakdown */}
      <div className="mt-2 rounded-lg bg-muted p-3">
        <div className="mb-2 text-xs font-semibold">Score Breakdown</div>
        {Object.entries(property.scoreBreakdown).map(([key, val]) => (
          <div key={key} className="mb-1">
            <div className="flex justify-between text-[0.7rem]">
              <span className="capitalize text-muted-foreground">{key}</span>
              <span className="font-medium">{val}</span>
            </div>
            <div className="mt-0.5 h-1.5 rounded-full bg-background">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${val}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Recent complaints */}
      {property.recentComplaints.length > 0 && (
        <div className="mt-1 rounded-lg bg-muted p-3">
          <div className="mb-1 text-xs font-semibold">
            Recent 311 Complaints
          </div>
          {property.recentComplaints.map((c, i) => (
            <div
              key={i}
              className="border-b border-border/50 py-1 text-[0.7rem]"
            >
              <span className="text-muted-foreground">{c.date}</span> —{' '}
              {c.category}{' '}
              <span
                className={
                  c.status === 'Open'
                    ? 'font-semibold text-red-600 dark:text-red-400'
                    : 'font-semibold text-emerald-600 dark:text-emerald-400'
                }
              >
                {c.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/50 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
