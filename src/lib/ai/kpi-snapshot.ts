import type { ExplorerData, ExplorerState } from '@/lib/explorer-types'

export function buildKpiSnapshot(state: ExplorerState, data: ExplorerData): string {
  const lines: Array<string> = []

  // Complaints
  if (data.csbData) {
    const csb = data.csbData
    const topCats = Object.entries(csb.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => `${k}: ${v.toLocaleString()}`)
      .join(', ')
    lines.push(
      `311 Complaints (${csb.year}): ${csb.totalRequests.toLocaleString()} total. Top categories: ${topCats}.`,
    )

    // Top neighborhoods by complaints
    const topHoods = Object.entries(csb.neighborhoods)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([, s]) => `${s.name}: ${s.total}`)
      .join(', ')
    lines.push(`Top complaint neighborhoods: ${topHoods}.`)
  }

  // Crime
  if (data.crimeData) {
    const crime = data.crimeData
    const topOffenses = Object.entries(crime.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => `${k}: ${v.toLocaleString()}`)
      .join(', ')
    lines.push(
      `Crime (${crime.year}): ${crime.totalIncidents.toLocaleString()} incidents, ${crime.totalFelonies.toLocaleString()} felonies, ${crime.totalFirearms.toLocaleString()} firearm incidents.`,
    )
    lines.push(`Top offenses: ${topOffenses}.`)

    const topCrimeHoods = Object.entries(crime.neighborhoods)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([, s]) => `${s.name}: ${s.total}`)
      .join(', ')
    lines.push(`Highest crime neighborhoods: ${topCrimeHoods}.`)
  }

  // Vacancy
  if (data.vacancyData) {
    const vac = data.vacancyData
    const byOwner: Record<string, number> = {}
    for (const p of vac) byOwner[p.owner] = (byOwner[p.owner] ?? 0) + 1
    const ownerBreakdown = Object.entries(byOwner)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
    const avgScore =
      Math.round((vac.reduce((s, p) => s + p.triageScore, 0) / vac.length) * 10) / 10
    lines.push(
      `Vacancy: ${vac.length} properties. Avg triage score: ${avgScore}. By owner: ${ownerBreakdown}.`,
    )
  }

  // Transit
  if (data.routes) {
    lines.push(`Transit: ${data.routes.length} routes.`)
  }
  if (data.stops) {
    lines.push(`Transit stops: ${data.stops.features.length}.`)
  }

  // ARPA
  if (data.arpaData) {
    const arpa = data.arpaData
    const topCats = Object.entries(arpa.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `${k}: $${Math.round(v / 1000)}k`)
      .join(', ')
    lines.push(
      `ARPA Funds: $${Math.round(arpa.totalSpent / 1_000_000 * 10) / 10}M total, ${arpa.projects.length} projects. Top categories: ${topCats}.`,
    )
  }

  // Demographics
  if (data.demographicsData) {
    const totalPop = Object.values(data.demographicsData).reduce(
      (s, d) => s + (d.population['2020'] ?? 0),
      0,
    )
    const avgVacancy =
      Math.round(
        (Object.values(data.demographicsData).reduce(
          (s, d) => s + d.housing.vacancyRate,
          0,
        ) /
          Object.keys(data.demographicsData).length) *
          10,
      ) / 10
    lines.push(
      `Demographics: Total pop ~${totalPop.toLocaleString()} (2020 Census). Avg housing vacancy rate: ${avgVacancy}%.`,
    )
  }

  // Food access
  if (data.foodDeserts) {
    lines.push(`Food access: ${data.foodDeserts.features.length} census tracts mapped.`)
  }
  if (data.groceryStores) {
    lines.push(`Grocery stores: ${data.groceryStores.features.length} locations.`)
  }

  // Selected entity info
  if (state.selected) {
    const sel = state.selected
    if (sel.type === 'neighborhood' && data.csbData?.neighborhoods[sel.id]) {
      const n = data.csbData.neighborhoods[sel.id]
      lines.push(
        `Selected neighborhood "${n.name}": ${n.total} complaints, avg resolution ${Math.round(n.avgResolutionDays)} days.`,
      )
    }
  }

  if (lines.length === 0) {
    return 'No data loaded yet. Layers need to be enabled to load data.'
  }

  return lines.join('\n')
}
