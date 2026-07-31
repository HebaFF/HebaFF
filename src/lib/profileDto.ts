import type { Profile } from "@prisma/client";
import { calcCarbRatio, calcISF } from "./calc";
import type { z } from "zod";
import type { profileSchema } from "./validation";

export type ProfileInput = z.infer<typeof profileSchema>;

// Shape the front end works with — mirrors the design prototype's flattened
// `profile` object (see design_handoff_glucodose/app.jsx / screens-*.jsx).
export type ProfileDTO = {
  name: string;
  gender: string;
  age: number;
  diagnosisDate: string;
  diabetesType: string;
  units: "mgdl" | "mmol";
  treatmentMode: string;
  insulinDelivery: string | null;
  rapidType: string | null;
  rapidUnits: number;
  rapidActionMinutes: number;
  basalType: string | null;
  basalUnits: number;
  pills: string[];
  tdd: number;
  carbRatio: number | null;
  isf: number | null;
  carbRatioOverridden: boolean;
};

export function toProfileDTO(p: Profile): ProfileDTO {
  return {
    name: p.name,
    gender: p.gender,
    age: p.age,
    diagnosisDate: p.diagnosisDate.toISOString().slice(0, 10),
    diabetesType: p.diabetesType,
    units: p.units as "mgdl" | "mmol",
    treatmentMode: p.treatmentMode,
    insulinDelivery: p.insulinDelivery,
    rapidType: p.rapidInsulinType,
    rapidUnits: p.rapidUnitsPerDay ?? 0,
    rapidActionMinutes: p.rapidActionMinutes,
    basalType: p.basalInsulinType,
    basalUnits: p.basalUnitsPerDay ?? 0,
    pills: JSON.parse(p.pills) as string[],
    tdd: (p.rapidUnitsPerDay ?? 0) + (p.basalUnitsPerDay ?? 0),
    carbRatio: p.carbRatio,
    isf: p.isf,
    carbRatioOverridden: p.carbRatioOverridden,
  };
}

// Computes carbRatio/isf server-side from the 500/1500-1700-2000 rules
// (never trust a client-submitted ratio unless the user explicitly opted
// into a doctor-provided override).
export function computeRatios(input: ProfileInput) {
  const usesInsulin = input.treatmentMode === "insulin" || input.treatmentMode === "both";
  const rapidUnits = input.rapidUnits || 0;
  const basalUnits = input.basalUnits || 0;
  const tdd = usesInsulin ? rapidUnits + basalUnits : 0;

  const autoCarbRatio = tdd > 0 ? calcCarbRatio(tdd) : null;
  const autoISF = tdd > 0 && rapidUnits > 0 ? calcISF(rapidUnits, basalUnits) : null;

  const carbRatio =
    input.carbRatioOverridden && input.manualCarbRatio ? input.manualCarbRatio : autoCarbRatio;
  const isf = input.carbRatioOverridden && input.manualISF ? input.manualISF : autoISF;

  return { tdd, carbRatio, isf };
}
