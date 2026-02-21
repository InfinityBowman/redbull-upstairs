import type { VacantProperty } from "./types";

const WEIGHTS = {
  condition: 0.25,
  complaintDensity: 0.2,
  lotSize: 0.1,
  ownership: 0.15,
  proximity: 0.15,
  taxDelinquency: 0.15,
};

export function calculateTriageScore(property: Omit<VacantProperty, "triageScore" | "scoreBreakdown" | "bestUse">) {
  const scores: Record<string, number> = {};

  scores.condition = Math.round(((5 - property.conditionRating) / 4) * 100);
  scores.complaintDensity = Math.min(100, Math.round((property.complaintsNearby / 20) * 100));
  scores.lotSize = Math.round(Math.min(property.lotSqFt / 10000, 1) * 100);

  if (property.owner === "LRA") {
    scores.ownership = 100;
  } else if (property.owner === "CITY") {
    scores.ownership = 70;
  } else {
    scores.ownership = Math.min(100, Math.round((property.taxYearsDelinquent / 5) * 50));
  }

  scores.proximity = property.proximityScore;
  scores.taxDelinquency = Math.min(100, Math.round((property.taxYearsDelinquent / 10) * 100));

  const composite = Math.round(
    scores.condition * WEIGHTS.condition +
    scores.complaintDensity * WEIGHTS.complaintDensity +
    scores.lotSize * WEIGHTS.lotSize +
    scores.ownership * WEIGHTS.ownership +
    scores.proximity * WEIGHTS.proximity +
    scores.taxDelinquency * WEIGHTS.taxDelinquency,
  );

  return {
    total: Math.min(100, Math.max(0, composite)),
    breakdown: scores,
  };
}

function calcHousingFit(p: Omit<VacantProperty, "triageScore" | "scoreBreakdown" | "bestUse">) {
  let score = 0;
  if (p.propertyType === "building") score += 35;
  score += p.conditionRating * 8;
  score += (p.proximityScore / 100) * 25;
  if (p.zoning?.startsWith("A") || p.zoning?.startsWith("B")) score += 15;
  score += (p.neighborhoodDemand / 100) * 15;
  return score;
}

function calcSolarFit(p: Omit<VacantProperty, "triageScore" | "scoreBreakdown" | "bestUse">) {
  let score = 0;
  if (p.propertyType === "lot") score += 30;
  score += Math.min(40, (p.lotSqFt / 15000) * 40);
  if (p.owner === "LRA") score += 15;
  score += ((100 - p.proximityScore) / 100) * 15;
  return score;
}

function calcGardenFit(p: Omit<VacantProperty, "triageScore" | "scoreBreakdown" | "bestUse">) {
  let score = 0;
  if (p.propertyType === "lot") score += 25;
  if (p.lotSqFt >= 2000 && p.lotSqFt <= 8000) score += 30;
  else if (p.lotSqFt < 2000) score += 10;
  else score += 15;
  score += (p.proximityScore / 100) * 25;
  score += (p.neighborhoodDemand / 100) * 15;
  if (p.owner === "LRA") score += 10;
  return score;
}

export function determineBestUse(property: Omit<VacantProperty, "triageScore" | "scoreBreakdown" | "bestUse">) {
  const housing = calcHousingFit(property);
  const solar = calcSolarFit(property);
  const garden = calcGardenFit(property);
  const best = Math.max(housing, solar, garden);
  if (best === housing) return "housing" as const;
  if (best === solar) return "solar" as const;
  return "garden" as const;
}
