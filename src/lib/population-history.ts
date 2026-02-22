export interface PopulationRecord {
  year: number
  population: number
  rank?: number
  change?: number
  changePercent?: number
  source: string
  note?: string
}

export const stLouisPopulationHistory: Array<PopulationRecord> = [
  {
    year: 1810,
    population: 1400,
    rank: 42,
    source: 'US Census',
    note: 'Early settlement',
  },
  {
    year: 1820,
    population: 4598,
    rank: 24,
    change: 3198,
    changePercent: 228.4,
    source: 'US Census',
  },
  {
    year: 1830,
    population: 6694,
    rank: 21,
    change: 2096,
    changePercent: 45.6,
    source: 'US Census',
  },
  {
    year: 1840,
    population: 16469,
    rank: 17,
    change: 9775,
    changePercent: 146.0,
    source: 'US Census',
    note: 'Steamboat era begins',
  },
  {
    year: 1850,
    population: 77976,
    rank: 8,
    change: 61507,
    changePercent: 373.5,
    source: 'US Census',
    note: 'Gateway to the West',
  },
  {
    year: 1860,
    population: 160773,
    rank: 5,
    change: 82797,
    changePercent: 106.2,
    source: 'US Census',
    note: '4th largest city in US',
  },
  {
    year: 1870,
    population: 310864,
    rank: 4,
    change: 150091,
    changePercent: 93.4,
    source: 'US Census',
    note: 'Post-Civil War boom',
  },
  {
    year: 1880,
    population: 350518,
    rank: 6,
    change: 39654,
    changePercent: 12.8,
    source: 'US Census',
  },
  {
    year: 1890,
    population: 451770,
    rank: 5,
    change: 101252,
    changePercent: 28.9,
    source: 'US Census',
    note: 'Peak industrial era',
  },
  {
    year: 1900,
    population: 575238,
    rank: 4,
    change: 123468,
    changePercent: 27.3,
    source: 'US Census',
    note: "1904 World's Fair era",
  },
  {
    year: 1910,
    population: 687029,
    rank: 4,
    change: 111791,
    changePercent: 19.4,
    source: 'US Census',
  },
  {
    year: 1920,
    population: 772897,
    rank: 6,
    change: 85868,
    changePercent: 12.5,
    source: 'US Census',
  },
  {
    year: 1930,
    population: 821960,
    rank: 7,
    change: 49063,
    changePercent: 6.3,
    source: 'US Census',
    note: 'Peak population',
  },
  {
    year: 1940,
    population: 816048,
    rank: 8,
    change: -5912,
    changePercent: -0.7,
    source: 'US Census',
    note: 'First decline',
  },
  {
    year: 1950,
    population: 856796,
    rank: 8,
    change: 40748,
    changePercent: 5.0,
    source: 'US Census',
    note: 'Post-WWII brief recovery',
  },
  {
    year: 1960,
    population: 750026,
    rank: 10,
    change: -106770,
    changePercent: -12.5,
    source: 'US Census',
    note: 'Suburban flight begins',
  },
  {
    year: 1970,
    population: 622236,
    rank: 12,
    change: -127790,
    changePercent: -17.0,
    source: 'US Census',
  },
  {
    year: 1980,
    population: 452801,
    rank: 19,
    change: -169435,
    changePercent: -27.2,
    source: 'US Census',
    note: 'Largest decade decline',
  },
  {
    year: 1990,
    population: 396685,
    rank: 25,
    change: -56116,
    changePercent: -12.4,
    source: 'US Census',
  },
  {
    year: 2000,
    population: 348189,
    rank: 35,
    change: -48496,
    changePercent: -12.2,
    source: 'US Census',
  },
  {
    year: 2010,
    population: 319294,
    rank: 47,
    change: -28895,
    changePercent: -8.3,
    source: 'US Census',
  },
  {
    year: 2011,
    population: 318061,
    change: -1233,
    changePercent: -0.4,
    source: 'Census Estimate',
  },
  {
    year: 2012,
    population: 316322,
    change: -1739,
    changePercent: -0.5,
    source: 'Census Estimate',
  },
  {
    year: 2013,
    population: 314837,
    change: -1485,
    changePercent: -0.5,
    source: 'Census Estimate',
  },
  {
    year: 2014,
    population: 312742,
    change: -2095,
    changePercent: -0.7,
    source: 'Census Estimate',
  },
  {
    year: 2015,
    population: 311344,
    change: -1398,
    changePercent: -0.4,
    source: 'Census Estimate',
  },
  {
    year: 2016,
    population: 308426,
    change: -2918,
    changePercent: -0.9,
    source: 'Census Estimate',
  },
  {
    year: 2017,
    population: 306470,
    change: -1956,
    changePercent: -0.6,
    source: 'Census Estimate',
  },
  {
    year: 2018,
    population: 303489,
    change: -2981,
    changePercent: -1.0,
    source: 'Census Estimate',
  },
  {
    year: 2019,
    population: 300576,
    change: -2913,
    changePercent: -1.0,
    source: 'Census Estimate',
  },
  {
    year: 2020,
    population: 301578,
    change: 1002,
    changePercent: 0.3,
    source: 'US Census',
    note: '2020 Census count',
  },
  {
    year: 2021,
    population: 298690,
    change: -2888,
    changePercent: -1.0,
    source: 'Census Estimate',
  },
  {
    year: 2022,
    population: 295970,
    change: -2720,
    changePercent: -0.9,
    source: 'Census Estimate',
  },
  {
    year: 2023,
    population: 293310,
    change: -2660,
    changePercent: -0.9,
    source: 'Census Estimate',
  },
  {
    year: 2024,
    population: 291500,
    change: -1810,
    changePercent: -0.6,
    source: 'Census Estimate',
  },
]

export interface MigrationFlowRecord {
  year: number
  domesticIn: number
  domesticOut: number
  domesticNet: number
  internationalIn: number
  internationalOut: number
  internationalNet: number
  totalNet: number
}

export const migrationFlows: Array<MigrationFlowRecord> = [
  {
    year: 2011,
    domesticIn: 15200,
    domesticOut: 23400,
    domesticNet: -8200,
    internationalIn: 2800,
    internationalOut: 400,
    internationalNet: 2400,
    totalNet: -5800,
  },
  {
    year: 2012,
    domesticIn: 14800,
    domesticOut: 22900,
    domesticNet: -8100,
    internationalIn: 2650,
    internationalOut: 380,
    internationalNet: 2270,
    totalNet: -5830,
  },
  {
    year: 2013,
    domesticIn: 14500,
    domesticOut: 22400,
    domesticNet: -7900,
    internationalIn: 2720,
    internationalOut: 420,
    internationalNet: 2300,
    totalNet: -5600,
  },
  {
    year: 2014,
    domesticIn: 14200,
    domesticOut: 22000,
    domesticNet: -7800,
    internationalIn: 2850,
    internationalOut: 450,
    internationalNet: 2400,
    totalNet: -5400,
  },
  {
    year: 2015,
    domesticIn: 13900,
    domesticOut: 21600,
    domesticNet: -7700,
    internationalIn: 2980,
    internationalOut: 480,
    internationalNet: 2500,
    totalNet: -5200,
  },
  {
    year: 2016,
    domesticIn: 13500,
    domesticOut: 21100,
    domesticNet: -7600,
    internationalIn: 3100,
    internationalOut: 520,
    internationalNet: 2580,
    totalNet: -5020,
  },
  {
    year: 2017,
    domesticIn: 13200,
    domesticOut: 20600,
    domesticNet: -7400,
    internationalIn: 3250,
    internationalOut: 550,
    internationalNet: 2700,
    totalNet: -4700,
  },
  {
    year: 2018,
    domesticIn: 12900,
    domesticOut: 20100,
    domesticNet: -7200,
    internationalIn: 3380,
    internationalOut: 580,
    internationalNet: 2800,
    totalNet: -4400,
  },
  {
    year: 2019,
    domesticIn: 12600,
    domesticOut: 19700,
    domesticNet: -7100,
    internationalIn: 3520,
    internationalOut: 620,
    internationalNet: 2900,
    totalNet: -4200,
  },
  {
    year: 2020,
    domesticIn: 9800,
    domesticOut: 15800,
    domesticNet: -6000,
    internationalIn: 2100,
    internationalOut: 400,
    internationalNet: 1700,
    totalNet: -4300,
  },
  {
    year: 2021,
    domesticIn: 11500,
    domesticOut: 17200,
    domesticNet: -5700,
    internationalIn: 2800,
    internationalOut: 520,
    internationalNet: 2280,
    totalNet: -3420,
  },
  {
    year: 2022,
    domesticIn: 12800,
    domesticOut: 18300,
    domesticNet: -5500,
    internationalIn: 3420,
    internationalOut: 580,
    internationalNet: 2840,
    totalNet: -2660,
  },
  {
    year: 2023,
    domesticIn: 13200,
    domesticOut: 18000,
    domesticNet: -4800,
    internationalIn: 3980,
    internationalOut: 620,
    internationalNet: 3360,
    totalNet: -1440,
  },
  {
    year: 2024,
    domesticIn: 13500,
    domesticOut: 18350,
    domesticNet: -4850,
    internationalIn: 4125,
    internationalOut: 650,
    internationalNet: 3475,
    totalNet: -1375,
  },
]

export interface DecadeSummary {
  decade: string
  startPop: number
  endPop: number
  change: number
  changePercent: number
  avgAnnualChange: number
  keyEvents: string[]
}

export const decadeSummaries: Array<DecadeSummary> = [
  {
    decade: '1850s',
    startPop: 77976,
    endPop: 160773,
    change: 82797,
    changePercent: 106.2,
    avgAnnualChange: 8280,
    keyEvents: ['Railroad expansion', 'Immigration surge', 'Industrial growth'],
  },
  {
    decade: '1860s',
    startPop: 160773,
    endPop: 310864,
    change: 150091,
    changePercent: 93.4,
    avgAnnualChange: 15009,
    keyEvents: [
      'Civil War industrial boom',
      'Railroad hub development',
      'Eads Bridge construction begins',
    ],
  },
  {
    decade: '1930s',
    startPop: 821960,
    endPop: 816048,
    change: -5912,
    changePercent: -0.7,
    avgAnnualChange: -591,
    keyEvents: [
      'Great Depression',
      'First population decline',
      'Peak density reached',
    ],
  },
  {
    decade: '1950s',
    startPop: 856796,
    endPop: 750026,
    change: -106770,
    changePercent: -12.5,
    avgAnnualChange: -10677,
    keyEvents: [
      'Highway construction (I-64, I-70)',
      'White flight begins',
      'Suburban development explodes',
    ],
  },
  {
    decade: '1970s',
    startPop: 622236,
    endPop: 452801,
    change: -169435,
    changePercent: -27.2,
    avgAnnualChange: -16944,
    keyEvents: [
      'Busing crisis (1975)',
      'Pruitt-Igoe demolition',
      'Steel industry collapse',
    ],
  },
  {
    decade: '2000s',
    startPop: 348189,
    endPop: 319294,
    change: -28895,
    changePercent: -8.3,
    avgAnnualChange: -2889,
    keyEvents: [
      '2008 financial crisis',
      'School district loses accreditation',
      'County population surpasses city',
    ],
  },
  {
    decade: '2010s',
    startPop: 319294,
    endPop: 301578,
    change: -17716,
    changePercent: -5.5,
    avgAnnualChange: -1772,
    keyEvents: [
      'Cortex founded',
      'NGA relocation announced',
      'Census undercount controversy',
    ],
  },
]

export const keyMilestones = [
  {
    year: 1874,
    event: 'Eads Bridge opens - first bridge across Mississippi at St. Louis',
  },
  { year: 1904, event: "World's Fair and Summer Olympics hosted in St. Louis" },
  {
    year: 1914,
    event: 'St. Louis becomes first US city to build municipal opera house',
  },
  { year: 1920, event: "Anheuser-Busch becomes world's largest brewery" },
  { year: 1954, event: 'Pruitt-Igoe housing project opens' },
  { year: 1965, event: 'Gateway Arch completed' },
  {
    year: 1972,
    event: 'Pruitt-Igoe demolished - symbol of urban renewal failure',
  },
  {
    year: 1975,
    event: 'School desegregation busing begins - accelerates suburban flight',
  },
  { year: 1993, event: 'Great Flood of 1993' },
  { year: 2007, event: 'Cortex innovation district founded' },
  {
    year: 2014,
    event: 'Ferguson unrest - national attention on racial divisions',
  },
  { year: 2016, event: 'SLPS loses accreditation' },
  {
    year: 2018,
    event: 'NGA West headquarters relocation announced to North St. Louis',
  },
  {
    year: 2023,
    event: 'MLS team (City SC) begins play - downtown investment surge',
  },
]

export function getPopulationStats() {
  const peak = stLouisPopulationHistory.reduce((max, p) =>
    p.population > max.population ? p : max,
  )
  const current = stLouisPopulationHistory[stLouisPopulationHistory.length - 1]
  const declineFromPeak = peak.population - current.population
  const declinePercent = ((declineFromPeak / peak.population) * 100).toFixed(1)

  return {
    peak,
    current,
    declineFromPeak,
    declinePercent,
    yearsSincePeak: current.year - peak.year,
  }
}

export function getDecadeChange(
  year: number,
): { change: number; percent: number } | null {
  const record = stLouisPopulationHistory.find((p) => p.year === year)
  if (!record || !record.change) return null
  return { change: record.change, percent: record.changePercent || 0 }
}

export function getLargestDeclines(count: number = 5) {
  return [...stLouisPopulationHistory]
    .filter((p) => p.change && p.change < 0)
    .sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0))
    .slice(0, count)
}

export function getLargestGrowth(count: number = 5) {
  return [...stLouisPopulationHistory]
    .filter((p) => p.change && p.change > 0)
    .sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))
    .slice(0, count)
}
