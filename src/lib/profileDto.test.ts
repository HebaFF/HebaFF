import { describe, expect, it } from "vitest";
import { computeRatios, type ProfileInput } from "./profileDto";

function baseInput(overrides: Partial<ProfileInput> = {}): ProfileInput {
  return {
    name: "Test",
    gender: "female",
    age: 30,
    diagnosisDate: "2020-01-01",
    diabetesType: "type1",
    units: "mgdl",
    treatmentMode: "insulin",
    insulinDelivery: "injections",
    rapidType: "Humalog (Lispro)",
    rapidUnits: 60,
    basalType: "Lantus (Glargine)",
    basalUnits: 35,
    pills: [],
    carbRatioOverridden: false,
    ...overrides,
  };
}

describe("computeRatios", () => {
  it("computes tdd/carbRatio/isf from the 500 & 1500/1700/2000 rules for insulin users", () => {
    const { tdd, carbRatio, isf } = computeRatios(baseInput());
    expect(tdd).toBe(95);
    expect(carbRatio).toBeCloseTo(500 / 95, 10);
    expect(isf).toBeCloseTo(1500 / 95, 10); // basal(35)/rapid(60) < 1 -> 1500 rule
  });

  it("skips dosing math for pills-only treatment", () => {
    const { tdd, carbRatio, isf } = computeRatios(
      baseInput({ treatmentMode: "pills", rapidUnits: undefined, basalUnits: undefined }),
    );
    expect(tdd).toBe(0);
    expect(carbRatio).toBeNull();
    expect(isf).toBeNull();
  });

  it("prefers a doctor-provided manual override when carbRatioOverridden is set", () => {
    const { carbRatio, isf } = computeRatios(
      baseInput({ carbRatioOverridden: true, manualCarbRatio: 8, manualISF: 40 }),
    );
    expect(carbRatio).toBe(8);
    expect(isf).toBe(40);
  });

  it("falls back to the auto-calculated values when override is on but no manual numbers were entered", () => {
    const { carbRatio, isf } = computeRatios(baseInput({ carbRatioOverridden: true }));
    expect(carbRatio).toBeCloseTo(500 / 95, 10);
    expect(isf).toBeCloseTo(1500 / 95, 10);
  });
});
