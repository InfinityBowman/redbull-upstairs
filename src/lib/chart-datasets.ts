import type { ExplorerData, LayerToggles } from './explorer-types'

// ── Field + Dataset Definitions ──────────────────────────────

export interface FieldDef {
  key: string
  label: string
  type: 'number' | 'category' | 'date'
}

export interface DatasetDef {
  key: string
  label: string
  group: string
  fields: FieldDef[]
  dynamicFields?: (data: ExplorerData) => FieldDef[]
  extract: (data: ExplorerData) => Record<string, string | number>[] | null
  requiredLayers: (keyof LayerToggles)[]
}

// ── Dataset Registry ─────────────────────────────────────────

export const DATASET_REGISTRY: DatasetDef[] = [
  // 311 Complaints
  {
    key: 'complaints-daily',
    label: 'Daily Complaints',
    group: '311 Complaints',
    fields: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'complaints', label: 'Complaints', type: 'number' },
      { key: 'ma7', label: '7-Day Avg', type: 'number' },
      { key: 'highTemp', label: 'High Temp', type: 'number' },
      { key: 'lowTemp', label: 'Low Temp', type: 'number' },
      { key: 'precip', label: 'Precipitation', type: 'number' },
    ],
    requiredLayers: ['complaints'],
    extract: (data) => {
      if (!data.csbData) return null
      const entries = Object.entries(data.csbData.dailyCounts).sort()
      const values = entries.map((e) => e[1])
      // Compute 7-day moving average
      const ma7: (number | null)[] = values.map((_, i) => {
        if (i < 6) return null
        let sum = 0
        for (let j = i - 6; j <= i; j++) sum += values[j]
        return Math.round((sum / 7) * 10) / 10
      })

      return entries.map(([date, count], i) => {
        const w = data.trendsData?.weather?.[date]
        return {
          date,
          complaints: count,
          ma7: ma7[i] ?? 0,
          highTemp: w?.high ?? 0,
          lowTemp: w?.low ?? 0,
          precip: w?.precip ?? 0,
        }
      })
    },
  },
  {
    key: 'complaints-category',
    label: 'By Category',
    group: '311 Complaints',
    fields: [
      { key: 'category', label: 'Category', type: 'category' },
      { key: 'count', label: 'Count', type: 'number' },
    ],
    requiredLayers: ['complaints'],
    extract: (data) => {
      if (!data.csbData) return null
      return Object.entries(data.csbData.categories)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({ category, count }))
    },
  },
  {
    key: 'complaints-neighborhood',
    label: 'By Neighborhood',
    group: '311 Complaints',
    fields: [
      { key: 'neighborhood', label: 'Neighborhood', type: 'category' },
      { key: 'total', label: 'Total', type: 'number' },
      { key: 'closureRate', label: 'Closure Rate %', type: 'number' },
      { key: 'avgResolutionDays', label: 'Avg Resolution Days', type: 'number' },
    ],
    requiredLayers: ['complaints'],
    extract: (data) => {
      if (!data.csbData) return null
      return Object.entries(data.csbData.neighborhoods).map(([, stats]) => ({
        neighborhood: stats.name,
        total: stats.total,
        closureRate:
          stats.total > 0
            ? Math.round((stats.closed / stats.total) * 1000) / 10
            : 0,
        avgResolutionDays: Math.round(stats.avgResolutionDays * 10) / 10,
      }))
    },
  },
  {
    key: 'complaints-hourly',
    label: 'By Hour',
    group: '311 Complaints',
    fields: [
      { key: 'hour', label: 'Hour', type: 'category' },
      { key: 'count', label: 'Count', type: 'number' },
    ],
    requiredLayers: ['complaints'],
    extract: (data) => {
      if (!data.csbData) return null
      return Object.entries(data.csbData.hourly)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([hour, count]) => ({
          hour: `${Number(hour) % 12 || 12}${Number(hour) < 12 ? 'a' : 'p'}`,
          count,
        }))
    },
  },
  {
    key: 'complaints-weekday',
    label: 'By Weekday',
    group: '311 Complaints',
    fields: [
      { key: 'day', label: 'Day', type: 'category' },
      { key: 'count', label: 'Count', type: 'number' },
    ],
    requiredLayers: ['complaints'],
    extract: (data) => {
      if (!data.csbData) return null
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return Object.entries(data.csbData.weekday)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([idx, count]) => ({
          day: dayNames[Number(idx)] ?? idx,
          count,
        }))
    },
  },
  {
    key: 'complaints-yoy',
    label: 'Year-over-Year',
    group: '311 Complaints',
    fields: [{ key: 'month', label: 'Month', type: 'category' }],
    dynamicFields: (data) => {
      if (!data.trendsData?.yearlyMonthly) return []
      return Object.keys(data.trendsData.yearlyMonthly)
        .sort()
        .map((year) => ({
          key: `y${year}`,
          label: year,
          type: 'number' as const,
        }))
    },
    requiredLayers: ['complaints'],
    extract: (data) => {
      if (!data.trendsData?.yearlyMonthly) return null
      const years = Object.keys(data.trendsData.yearlyMonthly).sort()
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ]
      return monthNames.map((month, mi) => {
        const row: Record<string, string | number> = { month }
        for (const year of years) {
          const monthKey = String(mi + 1).padStart(2, '0')
          row[`y${year}`] = data.trendsData!.yearlyMonthly[year]?.[monthKey] ?? 0
        }
        return row
      })
    },
  },

  // Vacancy
  {
    key: 'vacancy-properties',
    label: 'Properties',
    group: 'Vacancy',
    fields: [
      { key: 'address', label: 'Address', type: 'category' },
      { key: 'triageScore', label: 'Triage Score', type: 'number' },
      { key: 'lotSqFt', label: 'Lot SqFt', type: 'number' },
      { key: 'conditionRating', label: 'Condition', type: 'number' },
      { key: 'taxYearsDelinquent', label: 'Tax Years Delinquent', type: 'number' },
      { key: 'complaintsNearby', label: 'Complaints Nearby', type: 'number' },
      { key: 'assessedValue', label: 'Assessed Value', type: 'number' },
      { key: 'violationCount', label: 'Violations', type: 'number' },
    ],
    requiredLayers: ['vacancy'],
    extract: (data) => {
      if (!data.vacancyData) return null
      return data.vacancyData.map((p) => ({
        address: p.address,
        triageScore: p.triageScore,
        lotSqFt: p.lotSqFt,
        conditionRating: p.conditionRating,
        taxYearsDelinquent: p.taxYearsDelinquent,
        complaintsNearby: p.complaintsNearby,
        assessedValue: p.assessedValue,
        violationCount: p.violationCount,
      }))
    },
  },
  {
    key: 'vacancy-by-neighborhood',
    label: 'By Neighborhood',
    group: 'Vacancy',
    fields: [
      { key: 'neighborhood', label: 'Neighborhood', type: 'category' },
      { key: 'count', label: 'Count', type: 'number' },
      { key: 'avgTriageScore', label: 'Avg Triage Score', type: 'number' },
      { key: 'avgCondition', label: 'Avg Condition', type: 'number' },
    ],
    requiredLayers: ['vacancy'],
    extract: (data) => {
      if (!data.vacancyData) return null
      const groups: Record<
        string,
        { count: number; scoreSum: number; condSum: number }
      > = {}
      for (const p of data.vacancyData) {
        const g = (groups[p.neighborhood] ??= {
          count: 0,
          scoreSum: 0,
          condSum: 0,
        })
        g.count++
        g.scoreSum += p.triageScore
        g.condSum += p.conditionRating
      }
      return Object.entries(groups).map(([neighborhood, g]) => ({
        neighborhood,
        count: g.count,
        avgTriageScore: Math.round((g.scoreSum / g.count) * 10) / 10,
        avgCondition: Math.round((g.condSum / g.count) * 10) / 10,
      }))
    },
  },

  // Food Access
  {
    key: 'food-desert-tracts',
    label: 'Census Tracts',
    group: 'Food Access',
    fields: [
      { key: 'name', label: 'Name', type: 'category' },
      { key: 'population', label: 'Population', type: 'number' },
      { key: 'povertyRate', label: 'Poverty Rate %', type: 'number' },
      { key: 'pctNoVehicle', label: 'No Vehicle %', type: 'number' },
      { key: 'medianIncome', label: 'Median Income', type: 'number' },
    ],
    requiredLayers: ['foodAccess'],
    extract: (data) => {
      if (!data.foodDeserts) return null
      return data.foodDeserts.features.map((f) => {
        const p = f.properties
        return {
          name: p.name,
          population: p.pop,
          povertyRate: Math.round(p.poverty_rate * 10) / 10,
          pctNoVehicle: Math.round(p.pct_no_vehicle * 10) / 10,
          medianIncome: p.median_income,
        }
      })
    },
  },
]

export function getDataset(key: string): DatasetDef | undefined {
  return DATASET_REGISTRY.find((d) => d.key === key)
}

export function getDatasetFields(
  def: DatasetDef,
  data: ExplorerData,
): FieldDef[] {
  const dynamic = def.dynamicFields?.(data) ?? []
  return [...def.fields, ...dynamic]
}

// Group datasets by their group label
export function getGroupedDatasets(): Record<string, DatasetDef[]> {
  const groups: Record<string, DatasetDef[]> = {}
  for (const d of DATASET_REGISTRY) {
    ;(groups[d.group] ??= []).push(d)
  }
  return groups
}
