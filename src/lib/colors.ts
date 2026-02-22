// Choropleth color scale — 7 stops from low to high
export const CHORO_COLORS = [
  '#1a1f35',
  '#1b3a5c',
  '#1a6b6a',
  '#2f9e4f',
  '#85c531',
  '#f5c542',
  '#f94144',
]

export const CHORO_BREAKS = [0, 500, 1000, 1500, 2000, 3000, 5000]

export function getChoroColor(value: number, breaks = CHORO_BREAKS) {
  for (let i = breaks.length - 1; i >= 0; i--) {
    if (value >= breaks[i]) return CHORO_COLORS[i]
  }
  return CHORO_COLORS[0]
}

export function dynamicBreaks(values: Array<number>, steps = CHORO_COLORS.length) {
  const max = Math.max(...values, 1)
  return Array.from({ length: steps }, (_, i) => Math.round(max * (i / steps)))
}

// Category chart colors
export const CATEGORY_COLORS = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#e11d48',
  '#0ea5e9',
  '#d946ef',
  '#fbbf24',
  '#10b981',
  '#f43f5e',
  '#7c3aed',
  '#2dd4bf',
  '#fb923c',
]

// Crime choropleth scale
export const CRIME_COLORS = [
  '#1a1f35',
  '#4a1942',
  '#7a1b3a',
  '#a8332b',
  '#d4601a',
  '#f5a623',
  '#f94144',
]

// Demographics choropleth scale
export const DEMO_COLORS = [
  '#1a1f35',
  '#1e2d5c',
  '#234480',
  '#2b5ea2',
  '#3b82f6',
  '#7c3aed',
  '#a855f7',
]

// Vacancy triage score swatches
export const VACANCY_SCORE_ITEMS = [
  { color: '#1a9641', label: '80–100 High' },
  { color: '#a6d96a', label: '60–79 Moderate' },
  { color: '#ffffbf', label: '40–59 Low-Mod' },
  { color: '#fdae61', label: '20–39 Low' },
  { color: '#d7191c', label: '0–19 Very Low' },
]

// Vacancy triage score color
export function scoreColor(score: number) {
  if (score >= 80) return '#1a9641'
  if (score >= 60) return '#a6d96a'
  if (score >= 40) return '#ffffbf'
  if (score >= 20) return '#fdae61'
  return '#d7191c'
}

export function scoreLabel(score: number) {
  if (score >= 80) return 'High Priority'
  if (score >= 60) return 'Moderate'
  if (score >= 40) return 'Low-Moderate'
  if (score >= 20) return 'Low'
  return 'Very Low'
}

// Equity score severity
export function equitySeverity(score: number) {
  if (score < 30) return 'high' as const
  if (score < 60) return 'medium' as const
  return 'low' as const
}
