import { calculateTriageScore, determineBestUse } from './scoring'
import type { VacantProperty } from './types'

// Real St. Louis neighborhood data with approximate centroids
const STL_NEIGHBORHOODS = [
  { name: 'Old North St. Louis', lat: 38.661, lng: -90.196, vacancyRate: 0.55 },
  { name: 'Carr Square', lat: 38.641, lng: -90.196, vacancyRate: 0.5 },
  { name: 'Columbus Square', lat: 38.645, lng: -90.19, vacancyRate: 0.4 },
  { name: 'Hyde Park', lat: 38.659, lng: -90.208, vacancyRate: 0.52 },
  { name: 'College Hill', lat: 38.665, lng: -90.212, vacancyRate: 0.48 },
  { name: 'Fairground', lat: 38.66, lng: -90.22, vacancyRate: 0.44 },
  { name: 'JeffVanderLou', lat: 38.647, lng: -90.224, vacancyRate: 0.58 },
  { name: 'The Ville', lat: 38.652, lng: -90.235, vacancyRate: 0.45 },
  { name: 'Fountain Park', lat: 38.644, lng: -90.238, vacancyRate: 0.38 },
  { name: 'Lewis Place', lat: 38.649, lng: -90.24, vacancyRate: 0.42 },
  { name: 'Penrose', lat: 38.673, lng: -90.236, vacancyRate: 0.4 },
  { name: 'Wells-Goodfellow', lat: 38.67, lng: -90.275, vacancyRate: 0.5 },
  { name: 'Walnut Park East', lat: 38.687, lng: -90.254, vacancyRate: 0.46 },
  { name: 'Walnut Park West', lat: 38.687, lng: -90.27, vacancyRate: 0.43 },
  { name: 'Mark Twain', lat: 38.678, lng: -90.251, vacancyRate: 0.35 },
  { name: "O'Fallon", lat: 38.668, lng: -90.215, vacancyRate: 0.37 },
  { name: 'Greater Ville', lat: 38.656, lng: -90.23, vacancyRate: 0.49 },
  { name: 'Kingsway East', lat: 38.653, lng: -90.246, vacancyRate: 0.41 },
  { name: 'Kingsway West', lat: 38.653, lng: -90.258, vacancyRate: 0.39 },
  { name: 'Academy', lat: 38.656, lng: -90.26, vacancyRate: 0.33 },
  { name: 'North Pointe', lat: 38.655, lng: -90.213, vacancyRate: 0.47 },
  { name: 'Near North Riverfront', lat: 38.65, lng: -90.183, vacancyRate: 0.6 },
  { name: 'Baden', lat: 38.694, lng: -90.23, vacancyRate: 0.3 },
  { name: 'Riverview', lat: 38.702, lng: -90.206, vacancyRate: 0.28 },
  { name: 'Patch', lat: 38.634, lng: -90.213, vacancyRate: 0.32 },
  { name: 'Midtown', lat: 38.634, lng: -90.228, vacancyRate: 0.22 },
  { name: 'Central West End', lat: 38.643, lng: -90.262, vacancyRate: 0.08 },
  {
    name: 'Forest Park Southeast',
    lat: 38.631,
    lng: -90.255,
    vacancyRate: 0.12,
  },
  { name: 'Shaw', lat: 38.617, lng: -90.247, vacancyRate: 0.07 },
  { name: 'Tower Grove South', lat: 38.605, lng: -90.25, vacancyRate: 0.06 },
  { name: 'Dutchtown', lat: 38.591, lng: -90.238, vacancyRate: 0.14 },
  { name: 'Marine Villa', lat: 38.596, lng: -90.218, vacancyRate: 0.2 },
  { name: 'Benton Park', lat: 38.601, lng: -90.218, vacancyRate: 0.1 },
  { name: 'Gravois Park', lat: 38.601, lng: -90.231, vacancyRate: 0.18 },
  { name: 'Fox Park', lat: 38.612, lng: -90.22, vacancyRate: 0.16 },
  { name: 'McKinley Heights', lat: 38.615, lng: -90.211, vacancyRate: 0.15 },
  { name: 'Soulard', lat: 38.61, lng: -90.205, vacancyRate: 0.05 },
  { name: 'Bevo Mill', lat: 38.587, lng: -90.265, vacancyRate: 0.11 },
  { name: 'Carondelet', lat: 38.563, lng: -90.261, vacancyRate: 0.13 },
  { name: 'Holly Hills', lat: 38.574, lng: -90.265, vacancyRate: 0.08 },
  { name: 'Mount Pleasant', lat: 38.583, lng: -90.278, vacancyRate: 0.1 },
  { name: 'Princeton Heights', lat: 38.587, lng: -90.288, vacancyRate: 0.05 },
  { name: 'Skinker DeBaliviere', lat: 38.653, lng: -90.287, vacancyRate: 0.06 },
  { name: 'Hamilton Heights', lat: 38.658, lng: -90.277, vacancyRate: 0.28 },
  { name: 'Visitation Park', lat: 38.649, lng: -90.27, vacancyRate: 0.3 },
  { name: 'Vandeventer', lat: 38.644, lng: -90.25, vacancyRate: 0.36 },
]

const STREET_NAMES = [
  'N Broadway',
  'S Broadway',
  'Natural Bridge Ave',
  'Dr Martin Luther King Dr',
  'Cass Ave',
  'Florissant Ave',
  'N Grand Blvd',
  'S Grand Blvd',
  'Gravois Ave',
  'Chippewa St',
  'Arsenal St',
  'Manchester Ave',
  'Delmar Blvd',
  'Page Blvd',
  'Easton Ave',
  'Sullivan Ave',
  'Hebert St',
  'Blair Ave',
  'Palm St',
  'Obear Ave',
  'Penrose St',
  'Marcus Ave',
  'Margaretta Ave',
  'Newstead Ave',
  'Prairie Ave',
  'Benton St',
  'Montgomery St',
  'Bacon St',
  'Greer Ave',
  'Warne Ave',
  'Evans Ave',
  'St Louis Ave',
]

const ZIP_CODES = [
  '63101',
  '63102',
  '63103',
  '63104',
  '63106',
  '63107',
  '63108',
  '63109',
  '63110',
  '63111',
  '63112',
  '63113',
  '63115',
  '63116',
  '63118',
  '63120',
]
const ZONING_CODES = ['A', 'B', 'C', 'D', 'F', 'G', 'H', 'J']
const COMPLAINT_CATEGORIES = [
  'Vacant Building - Open/Dangerous',
  'High Weeds/Grass - Vacant',
  'Debris/Refuse Accumulation',
  'Structural Defect - Residential',
  'Rodent Infestation',
  'Illegal Dumping',
  'Property Damage',
  'Graffiti',
]

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function generateVacancyData(): Array<VacantProperty> {
  const rand = seededRandom(42)
  const randomInt = (min: number, max: number) =>
    Math.floor(rand() * (max - min + 1)) + min
  const randomFloat = (min: number, max: number) => rand() * (max - min) + min
  const pick = <T>(arr: Array<T>): T => arr[Math.floor(rand() * arr.length)]

  const properties: Array<VacantProperty> = []
  let id = 1

  for (const hood of STL_NEIGHBORHOODS) {
    const count = Math.round(hood.vacancyRate * 40) + randomInt(3, 10)

    for (let i = 0; i < count; i++) {
      const lat = hood.lat + randomFloat(-0.006, 0.006)
      const lng = hood.lng + randomFloat(-0.006, 0.006)
      const ward = randomInt(1, 28)
      const block = randomInt(1000, 9999)
      const parcel = randomInt(100, 999)
      const parcelId = `${ward.toString().padStart(2, '0')}${block}${parcel}`

      const isBuilding = rand() < 0.4
      const isLRA = rand() < (hood.vacancyRate > 0.3 ? 0.55 : 0.25)
      const isCity = !isLRA && rand() < 0.1
      const owner = isLRA
        ? ('LRA' as const)
        : isCity
          ? ('CITY' as const)
          : ('PRIVATE' as const)

      const condBase = isBuilding
        ? Math.max(
            1,
            Math.min(
              5,
              Math.round(3 - hood.vacancyRate * 4 + randomFloat(-1, 1.5)),
            ),
          )
        : Math.max(
            1,
            Math.min(
              5,
              Math.round(3.5 - hood.vacancyRate * 2 + randomFloat(-0.5, 1)),
            ),
          )

      const lotSqFt = isBuilding
        ? randomInt(1200, 6000)
        : randomInt(1500, 15000)
      const taxYearsDelinquent = Math.max(
        0,
        isLRA ? randomInt(3, 15) : randomInt(0, 10),
      )
      const complaintsNearby = Math.max(
        0,
        Math.round(hood.vacancyRate * 30 + randomFloat(-5, 10)),
      )
      const proximityScore = Math.max(
        0,
        Math.min(
          100,
          Math.round((1 - hood.vacancyRate) * 80 + randomFloat(-10, 10)),
        ),
      )
      const neighborhoodDemand = Math.max(
        0,
        Math.min(
          100,
          Math.round((1 - hood.vacancyRate * 0.5) * 60 + randomFloat(-15, 25)),
        ),
      )
      const boardUpStatus = isBuilding
        ? rand() < 0.6
          ? 'Boarded'
          : rand() < 0.5
            ? 'Open'
            : 'Secured'
        : 'N/A'
      const violationCount = Math.max(
        0,
        isBuilding ? randomInt(0, 12) : randomInt(0, 4),
      )
      const condemned = isBuilding && condBase <= 1 && rand() < 0.7
      const assessedValue = isBuilding
        ? randomInt(2000, 35000)
        : randomInt(500, 8000)
      const yearBuilt = isBuilding ? randomInt(1870, 1965) : null
      const stories = isBuilding ? randomInt(1, 3) : 0

      const recentComplaints = []
      const numComplaints = randomInt(0, Math.min(5, complaintsNearby))
      for (let c = 0; c < numComplaints; c++) {
        recentComplaints.push({
          category: pick(COMPLAINT_CATEGORIES),
          date: `2025-${randomInt(1, 12).toString().padStart(2, '0')}-${randomInt(1, 28).toString().padStart(2, '0')}`,
          status: rand() < 0.6 ? 'Closed' : 'Open',
        })
      }

      const base = {
        id: id++,
        parcelId,
        address: `${randomInt(1000, 5999)} ${pick(STREET_NAMES)}`,
        zip: pick(ZIP_CODES),
        lat: Math.round(lat * 10000) / 10000,
        lng: Math.round(lng * 10000) / 10000,
        ward,
        neighborhood: hood.name,
        propertyType: (isBuilding ? 'building' : 'lot'),
        owner,
        conditionRating: Math.max(1, Math.min(5, condBase)),
        lotSqFt,
        zoning: pick(ZONING_CODES),
        taxYearsDelinquent,
        complaintsNearby,
        proximityScore,
        neighborhoodDemand,
        boardUpStatus,
        violationCount,
        condemned,
        assessedValue,
        yearBuilt,
        stories,
        recentComplaints,
        vacancyCategory: condemned
          ? 'Definite'
          : isLRA
            ? 'Definite'
            : taxYearsDelinquent > 3
              ? 'Very Likely'
              : violationCount > 2
                ? 'Possibly'
                : 'Indeterminant',
      }

      const score = calculateTriageScore(base)
      const bestUse = determineBestUse(base)

      properties.push({
        ...base,
        triageScore: score.total,
        scoreBreakdown: score.breakdown,
        bestUse,
      })
    }
  }

  return properties
}
