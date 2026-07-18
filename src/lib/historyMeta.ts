import type { BadgeTone } from "@/components/ui";

export const RANGE_TONE: Record<string, BadgeTone> = { low: "good", high: "danger", inRange: "primary" };

export const TYPE_TONE: Record<string, BadgeTone> = {
  meal: "primary",
  mealCorrection: "primary",
  correction: "neutral",
  hypo: "danger",
  bg: "neutral",
};
