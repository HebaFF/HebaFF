import { describe, expect, it } from "vitest";
import {
  calcCarbRatio,
  calcISF,
  calcCarbRise,
  round2,
  convertBG,
  classifyBG,
  mealDose,
  correctionDose,
  hypoCarbsNeeded,
} from "./calc";

// These formulas are ported verbatim from design_handoff_glucodose/data.js —
// see that file's README for the clinical rules they encode. Do not change
// expected values here without product/clinical sign-off on the source.

describe("calcCarbRatio", () => {
  it("applies the 500 rule", () => {
    expect(calcCarbRatio(95)).toBeCloseTo(500 / 95, 10);
    expect(calcCarbRatio(50)).toBe(10);
  });
});

describe("calcISF", () => {
  it("uses 1500 when basal:rapid ratio is below 1", () => {
    // basal 35 / rapid 60 = 0.583... < 1
    expect(calcISF(60, 35)).toBeCloseTo(1500 / 95, 10);
  });

  it("uses 1700 when basal:rapid ratio is exactly 1", () => {
    expect(calcISF(40, 40)).toBeCloseTo(1700 / 80, 10);
  });

  it("uses 2000 when basal:rapid ratio is above 1", () => {
    expect(calcISF(20, 40)).toBeCloseTo(2000 / 60, 10);
  });
});

describe("calcCarbRise", () => {
  it("divides ISF by carb ratio", () => {
    expect(calcCarbRise(15, 5)).toBe(3);
  });
});

describe("round2", () => {
  it("rounds to 2 decimal places", () => {
    expect(round2(5.26315789)).toBe(5.26);
    expect(round2(15.78947368)).toBe(15.79);
  });
});

describe("convertBG", () => {
  it("passes mg/dL through rounded to the nearest integer", () => {
    expect(convertBG(125.6, "mgdl")).toBe(126);
  });

  it("converts mg/dL to mmol/L", () => {
    expect(convertBG(180, "mmol")).toBeCloseTo(180 / 18.0182, 2);
  });
});

describe("classifyBG", () => {
  it("classifies mg/dL values", () => {
    expect(classifyBG(69, "mgdl")).toBe("low");
    expect(classifyBG(70, "mgdl")).toBe("inRange");
    expect(classifyBG(180, "mgdl")).toBe("inRange");
    expect(classifyBG(181, "mgdl")).toBe("high");
  });

  it("converts mmol/L before classifying", () => {
    // 3.8 mmol/L * 18.0182 = ~68.5 mg/dL -> low
    expect(classifyBG(3.8, "mmol")).toBe("low");
    // 7 mmol/L * 18.0182 = ~126 mg/dL -> inRange
    expect(classifyBG(7, "mmol")).toBe("inRange");
    // 11 mmol/L * 18.0182 = ~198 mg/dL -> high
    expect(classifyBG(11, "mmol")).toBe("high");
  });

  it("returns null for a falsy/zero reading", () => {
    expect(classifyBG(0, "mgdl")).toBeNull();
  });
});

describe("mealDose", () => {
  it("divides total carbs by carb ratio", () => {
    expect(mealDose(27, 500 / 95)).toBeCloseTo(27 / (500 / 95), 10);
  });
});

describe("correctionDose", () => {
  it("computes (current - target) / isf", () => {
    expect(correctionDose(250, 130, 50)).toBe(2.4);
  });

  it("never goes negative when current is below target", () => {
    expect(correctionDose(90, 130, 50)).toBe(0);
  });
});

describe("hypoCarbsNeeded", () => {
  it("computes carbs needed when target is above current", () => {
    expect(hypoCarbsNeeded(60, 100, 4)).toBe(10);
  });

  it("returns 0 when target is not above current", () => {
    expect(hypoCarbsNeeded(120, 100, 4)).toBe(0);
    expect(hypoCarbsNeeded(100, 100, 4)).toBe(0);
  });
});
