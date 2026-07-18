import type { BadgeTone } from "@/components/ui";

export const RANGE_TONE: Record<string, BadgeTone> = { low: "good", high: "danger", inRange: "primary" };
export const RANGE_LABEL: Record<string, string> = { low: "Low", high: "High", inRange: "In range" };

export const TYPE_META: Record<string, { label: string; tone: BadgeTone }> = {
  meal: { label: "Meal dose", tone: "primary" },
  mealCorrection: { label: "Meal + correction", tone: "primary" },
  correction: { label: "Correction dose", tone: "neutral" },
  hypo: { label: "Low BG treated", tone: "danger" },
  bg: { label: "Glucose reading", tone: "neutral" },
};
