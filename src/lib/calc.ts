// Calculation logic ported exactly from the design prototype's data.js
// (450/500 & 1500/1700/2000 rules). Do not change these formulas without
// product sign-off — see design_handoff_glucodose/README.md.

export function calcCarbRatio(tdd: number): number {
  return 500 / tdd; // grams of carb covered by 1 unit of rapid insulin
}

export function calcISF(rapidUnits: number, basalUnits: number): number {
  const tdd = rapidUnits + basalUnits;
  const ratio = basalUnits / rapidUnits;
  const numerator = ratio === 1 ? 1700 : ratio < 1 ? 1500 : 2000;
  return numerator / tdd;
}

// mg/dL that 1g of carb raises blood glucose = ISF / carbRatio
export function calcCarbRise(isf: number, carbRatio: number): number {
  return isf / carbRatio;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const MGDL_TO_MMOL = 1 / 18.0182;

export function convertBG(value: number, toUnit: "mgdl" | "mmol"): number {
  if (toUnit === "mmol") return round2(value * MGDL_TO_MMOL);
  return Math.round(value);
}

export type BGRange = "low" | "high" | "inRange" | null;

export function classifyBG(value: number, units: "mgdl" | "mmol"): BGRange {
  const mgdl = units === "mmol" ? Number(value) * 18.0182 : Number(value);
  if (!mgdl) return null;
  if (mgdl < 70) return "low";
  if (mgdl > 180) return "high";
  return "inRange";
}

// Dose formulas (see design_handoff_glucodose/screens-calculator.jsx)
export function mealDose(totalCarbs: number, carbRatio: number): number {
  return totalCarbs / carbRatio;
}

export function correctionDose(currentBG: number, targetBG: number, isf: number): number {
  return Math.max(0, (currentBG - targetBG) / isf);
}

export function hypoCarbsNeeded(currentBG: number, targetBG: number, carbRise: number): number {
  if (!(targetBG > currentBG)) return 0;
  return (targetBG - currentBG) / carbRise;
}
