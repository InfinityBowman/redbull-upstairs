import type { GeoJSONCollection, NeighborhoodProperties } from '@/lib/types'

interface ResolvedNeighborhood {
  nhdNum: string
  name: string
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: Array<Array<number>> = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

// Common aliases
const ALIASES: Record<string, string> = {
  downtown: 'Downtown',
  'jeff vanderlou': 'Jeff Vanderlou',
  jeffvanderlou: 'Jeff Vanderlou',
  'the ville': 'The Ville',
  ville: 'The Ville',
  cwe: 'Central West End',
  'central west end': 'Central West End',
  soulard: 'Soulard',
  'tower grove': 'Tower Grove South',
  'tower grove s': 'Tower Grove South',
  'tower grove e': 'Tower Grove East',
  tgs: 'Tower Grove South',
  tge: 'Tower Grove East',
  'grand center': 'Covenant Blu-Grand Center',
  'bevo': 'Bevo Mill',
  'the hill': 'The Hill',
  'old north': 'Old North St. Louis',
}

export function resolveNeighborhood(
  query: string,
  neighborhoods: GeoJSONCollection<NeighborhoodProperties>,
): ResolvedNeighborhood | null {
  const q = query.toLowerCase().trim()
  if (!q) return null

  // Check aliases first
  const target = (ALIASES[q] ?? q).toLowerCase()

  // Build lookup from GeoJSON features
  const entries = neighborhoods.features.map((f) => ({
    nhdNum: String(f.properties.NHD_NUM).padStart(2, '0'),
    name: f.properties.NHD_NAME,
  }))

  // Exact match (case-insensitive)
  const exact = entries.find((e) => e.name.toLowerCase() === target)
  if (exact) return exact

  // Starts-with match
  const startsWith = entries.find((e) => e.name.toLowerCase().startsWith(q))
  if (startsWith) return startsWith

  // Contains match
  const contains = entries.find((e) => e.name.toLowerCase().includes(q))
  if (contains) return contains

  // Levenshtein distance fallback (threshold: 3)
  let bestMatch: ResolvedNeighborhood | null = null
  let bestDist = Infinity
  for (const entry of entries) {
    const dist = levenshtein(q, entry.name.toLowerCase())
    if (dist < bestDist) {
      bestDist = dist
      bestMatch = entry
    }
  }

  return bestDist <= 3 ? bestMatch : null
}
