export interface MigrationReason {
  reason: string
  percentage: number
  category: 'education' | 'safety' | 'housing' | 'jobs' | 'taxes' | 'services'
}

export const leavingReasons: Array<MigrationReason> = [
  {
    reason: 'Better schools for children',
    percentage: 34,
    category: 'education',
  },
  { reason: 'Safety/crime concerns', percentage: 28, category: 'safety' },
  { reason: 'Larger/newer housing', percentage: 22, category: 'housing' },
  { reason: 'Lower property taxes', percentage: 18, category: 'taxes' },
  { reason: 'Job relocation', percentage: 15, category: 'jobs' },
  { reason: 'Better city services', percentage: 12, category: 'services' },
  { reason: 'Lower cost of living', percentage: 10, category: 'housing' },
  { reason: 'Neighborhood decline', percentage: 9, category: 'safety' },
]

export const cityVsCountyComparison = {
  city: {
    population: 293310,
    medianIncome: 50900,
    propertyTaxRate: 8.24,
    crimeRate: 87.4,
    schoolRating: 3.2,
    vacantProperties: 19000,
  },
  county: {
    population: 1016315,
    medianIncome: 65300,
    propertyTaxRate: 5.84,
    crimeRate: 24.6,
    schoolRating: 7.1,
    vacantProperties: 2800,
  },
}

export const annualMigration = [
  {
    year: 2010,
    domesticOutflow: -8420,
    internationalInflow: 2130,
    netChange: -6290,
  },
  {
    year: 2012,
    domesticOutflow: -7920,
    internationalInflow: 1950,
    netChange: -5970,
  },
  {
    year: 2014,
    domesticOutflow: -7650,
    internationalInflow: 2080,
    netChange: -5570,
  },
  {
    year: 2016,
    domesticOutflow: -7180,
    internationalInflow: 2340,
    netChange: -4840,
  },
  {
    year: 2018,
    domesticOutflow: -6920,
    internationalInflow: 2680,
    netChange: -4240,
  },
  {
    year: 2020,
    domesticOutflow: -5840,
    internationalInflow: 1890,
    netChange: -3950,
  },
  {
    year: 2022,
    domesticOutflow: -5210,
    internationalInflow: 3420,
    netChange: -1790,
  },
  {
    year: 2024,
    domesticOutflow: -4850,
    internationalInflow: 4125,
    netChange: -725,
  },
]

export const topDestinations = [
  { destination: 'St. Louis County', movers: 4200, percentage: 52 },
  { destination: 'St. Charles County', movers: 1850, percentage: 23 },
  { destination: 'Jefferson County', movers: 720, percentage: 9 },
  { destination: 'Franklin County', movers: 480, percentage: 6 },
  { destination: 'Other Missouri', movers: 400, percentage: 5 },
  { destination: 'Other States', movers: 620, percentage: 8 },
]

export const schoolEnrollmentDecline = [
  { year: 2010, slps: 24800, charter: 8200, private: 18200, total: 51200 },
  { year: 2013, slps: 23500, charter: 9800, private: 16400, total: 49700 },
  { year: 2016, slps: 21800, charter: 11200, private: 14800, total: 47800 },
  { year: 2019, slps: 20300, charter: 12100, private: 13100, total: 45500 },
  { year: 2022, slps: 18900, charter: 12800, private: 11500, total: 43200 },
  { year: 2024, slps: 18200, charter: 13200, private: 10800, total: 42200 },
]

export const propertyTaxComparison = [
  { area: 'City of St. Louis', rate: 8.24, avgBill: 3850 },
  { area: 'St. Louis County', rate: 5.84, avgBill: 2940 },
  { area: 'St. Charles County', rate: 4.92, avgBill: 2420 },
  { area: 'Jefferson County', rate: 4.45, avgBill: 1850 },
  { area: 'Franklin County', rate: 4.12, avgBill: 1620 },
]

export const householdIncomeByYear = [
  { year: 2010, city: 34400, metro: 52800 },
  { year: 2014, city: 35900, metro: 55200 },
  { year: 2018, city: 43200, metro: 59800 },
  { year: 2022, city: 50900, metro: 65300 },
  { year: 2024, city: 52400, metro: 67800 },
]

export const violentCrimeTrend = [
  { year: 2015, city: 1880, national: 373 },
  { year: 2017, city: 2050, national: 383 },
  { year: 2019, city: 1930, national: 380 },
  { year: 2020, city: 1870, national: 398 },
  { year: 2021, city: 2010, national: 403 },
  { year: 2022, city: 1740, national: 381 },
  { year: 2023, city: 1620, national: 370 },
]

export const vacancyHotspots = [
  { neighborhood: 'Jeff Vanderlou', rate: 42, homes: 1850 },
  { neighborhood: 'The Ville', rate: 38, homes: 1120 },
  { neighborhood: 'Greater Ville', rate: 35, homes: 980 },
  { neighborhood: 'North Pointe', rate: 33, homes: 720 },
  { neighborhood: 'Walnut Park East', rate: 31, homes: 890 },
  { neighborhood: 'Hyde Park', rate: 29, homes: 650 },
  { neighborhood: 'College Hill', rate: 27, homes: 580 },
  { neighborhood: "O'Fallon", rate: 25, homes: 620 },
]
