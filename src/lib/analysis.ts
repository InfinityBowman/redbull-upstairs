import type { CSBData, NeighborhoodStats, TrendsData, VacantProperty } from './types'
import type { SubToggles } from './explorer-types'

/** Detect volume hotspots (neighborhoods with >2x avg complaints) */
export function detectVolumeHotspots(data: CSBData, limit = 5) {
  const hoods = Object.entries(data.neighborhoods)
    .map(([id, h]) => ({ id, ...h }))
    .filter((h) => h.total > 50)

  const avgTotal = hoods.reduce((s, h) => s + h.total, 0) / hoods.length

  return hoods
    .filter((h) => h.total > avgTotal * 2)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((h) => ({
      ...h,
      ratio: +(h.total / avgTotal).toFixed(1),
    }))
}

/** Detect slow-resolution hotspots */
export function detectSlowHotspots(data: CSBData, limit = 5) {
  const hoods = Object.entries(data.neighborhoods)
    .map(([id, h]) => ({ id, ...h }))
    .filter((h) => h.total > 50)

  const resHoods = hoods.filter((h) => h.avgResolutionDays > 0)
  const avgRes =
    resHoods.reduce((s, h) => s + h.avgResolutionDays, 0) / resHoods.length

  return hoods
    .filter((h) => h.avgResolutionDays > avgRes * 1.5 && h.total > 200)
    .sort((a, b) => b.avgResolutionDays - a.avgResolutionDays)
    .slice(0, limit)
    .map((h) => ({
      ...h,
      ratio: +(h.avgResolutionDays / avgRes).toFixed(1),
    }))
}

/** Weather correlation insights */
export function weatherInsights(
  daily: Record<string, number>,
  weather: TrendsData['weather'],
) {
  const rainy: Array<number> = []
  const dry: Array<number> = []
  const afterHeavy: Array<number> = []
  const afterNormal: Array<number> = []
  const hot: Array<number> = []
  const cool: Array<number> = []

  const dates = Object.keys(daily).sort()

  dates.forEach((date, i) => {
    const w = weather[date]
    if (!w) return

    if (w.precip > 0.1) rainy.push(daily[date])
    else dry.push(daily[date])

    if (i < dates.length - 1) {
      const next = dates[i + 1]
      if (w.precip > 0.5) afterHeavy.push(daily[next])
      else afterNormal.push(daily[next])
    }

    if (w.high > 90) hot.push(daily[date])
    else if (w.high < 70) cool.push(daily[date])
  })

  const avg = (arr: Array<number>) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0

  const avgRainy = avg(rainy)
  const avgDry = avg(dry)
  const avgAfterHeavy = avg(afterHeavy)
  const avgNormal = avg(afterNormal)
  const avgHot = avg(hot)
  const avgCool = avg(cool)

  return {
    rain: {
      avgRainy,
      avgDry,
      diff: avgDry ? +(((avgRainy - avgDry) / avgDry) * 100).toFixed(0) : 0,
    },
    afterRain: {
      avgAfterHeavy,
      avgNormal,
      diff: avgNormal
        ? +(((avgAfterHeavy - avgNormal) / avgNormal) * 100).toFixed(0)
        : 0,
    },
    temp: {
      avgHot,
      avgCool,
      diff: avgCool ? +(((avgHot - avgCool) / avgCool) * 100).toFixed(0) : 0,
    },
  }
}

/** Compute 7-day moving average */
export function movingAverage(values: Array<number>, window = 7): Array<number | null> {
  return values.map((_, i) => {
    if (i < window - 1) return null
    const slice = values.slice(i - window + 1, i + 1)
    return Math.round(slice.reduce((a, b) => a + b) / window)
  })
}

/** Get complaint count for a neighborhood by category */
export function getHoodComplaintCount(
  data: CSBData,
  hoodNum: number,
  category: string,
): number {
  const key = String(hoodNum).padStart(2, '0')
  const hood = data.neighborhoods[key]
  if (!hood) return 0
  if (category === 'all') return hood.total
  return hood.topCategories?.[category] ?? 0
}

/** Filter vacancy data by sub-toggle state */
export function filterVacancies(
  data: Array<VacantProperty>,
  toggles: SubToggles,
): Array<VacantProperty> {
  const {
    vacancyUseFilter,
    vacancyOwnerFilter,
    vacancyTypeFilter,
    vacancyHoodFilter,
    vacancyMinScore,
    vacancyMaxScore,
  } = toggles
  return data.filter((p) => {
    if (p.triageScore < vacancyMinScore || p.triageScore > vacancyMaxScore) return false
    if (vacancyUseFilter !== 'all' && p.bestUse !== vacancyUseFilter) return false
    if (vacancyOwnerFilter === 'lra' && p.owner !== 'LRA') return false
    if (vacancyOwnerFilter === 'private' && p.owner !== 'PRIVATE') return false
    if (vacancyOwnerFilter === 'city' && p.owner !== 'CITY') return false
    if (vacancyTypeFilter === 'lot' && p.propertyType !== 'lot') return false
    if (vacancyTypeFilter === 'building' && p.propertyType !== 'building') return false
    if (vacancyHoodFilter !== 'all' && p.neighborhood !== vacancyHoodFilter) return false
    return true
  })
}

/** Build heatmap GeoJSON from point tuples [lat, lon, ...] */
export function buildHeatmapGeo(
  points: Array<Array<number | string>>,
): GeoJSON.FeatureCollection | null {
  if (points.length === 0) return null
  return {
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature' as const,
      properties: { weight: 0.6 },
      geometry: { type: 'Point' as const, coordinates: [p[1] as number, p[0] as number] },
    })),
  }
}

/** City-wide KPI stats from CSB data */
export function computeKPIs(data: CSBData) {
  const hoods = Object.values(data.neighborhoods)
  const hoodsWithRes = hoods.filter((h) => h.avgResolutionDays > 0)
  const avgResolution =
    hoodsWithRes.reduce((s, h) => s + h.avgResolutionDays, 0) /
    hoodsWithRes.length
  const closedCount = hoods.reduce((s, h) => s + h.closed, 0)
  const closedPct = +((closedCount / data.totalRequests) * 100).toFixed(1)

  const slowest = hoods
    .filter((h) => h.total > 100)
    .sort((a, b) => b.avgResolutionDays - a.avgResolutionDays)[0]

  const dailyVals = Object.entries(data.dailyCounts)
  const peakDay = dailyVals.sort((a, b) => b[1] - a[1])[0] ?? ['N/A', 0]
  const actualDays = Object.keys(data.dailyCounts).length || 365

  return {
    totalRequests: data.totalRequests,
    perDay: Math.round(data.totalRequests / actualDays),
    closedPct,
    closedCount,
    avgResolution: +avgResolution.toFixed(1),
    slowest,
    peakDay: { date: peakDay[0], count: peakDay[1] },
  }
}
