import type { LogEntry } from "./api";
import { classifyBG } from "./calc";

export type TimeWindow = "breakfast" | "lunch" | "dinner" | "other";

export type Tip =
  | { kind: "timeInRangeHigh"; pct: number }
  | { kind: "timeInRangeLow"; pct: number }
  | { kind: "timeOfDay"; window: TimeWindow; pct: number }
  | { kind: "loggingGap" };

const MIN_READINGS_FOR_TIPS = 5;
const MIN_READINGS_PER_WINDOW = 3;
const HIGH_PCT_THRESHOLD = 40;
const LOW_PCT_THRESHOLD = 15;
const TIME_OF_DAY_DEVIATION_THRESHOLD = 20;

function windowFor(hour: number): TimeWindow {
  if (hour >= 5 && hour < 10) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 17 && hour < 21) return "dinner";
  return "other";
}

export function generateTips(entries: LogEntry[], units: "mgdl" | "mmol", now = Date.now()): Tip[] {
  const tips: Tip[] = [];
  const cutoff = now - 14 * 24 * 60 * 60 * 1000;
  const readings = entries.filter((e) => e.timestamp >= cutoff && e.currentBG !== undefined);

  if (readings.length >= MIN_READINGS_FOR_TIPS) {
    const counts = { low: 0, high: 0, inRange: 0 };
    readings.forEach((e) => {
      const range = classifyBG(e.currentBG!, units);
      if (range) counts[range]++;
    });
    const total = readings.length;
    const highPct = Math.round((counts.high / total) * 100);
    const lowPct = Math.round((counts.low / total) * 100);
    const overallHighRate = counts.high / total;

    if (highPct >= HIGH_PCT_THRESHOLD) tips.push({ kind: "timeInRangeHigh", pct: highPct });
    if (lowPct >= LOW_PCT_THRESHOLD) tips.push({ kind: "timeInRangeLow", pct: lowPct });

    const byWindow: Record<TimeWindow, { high: number; total: number }> = {
      breakfast: { high: 0, total: 0 },
      lunch: { high: 0, total: 0 },
      dinner: { high: 0, total: 0 },
      other: { high: 0, total: 0 },
    };
    readings.forEach((e) => {
      const w = windowFor(new Date(e.timestamp).getHours());
      byWindow[w].total++;
      if (classifyBG(e.currentBG!, units) === "high") byWindow[w].high++;
    });

    type Strongest = { window: TimeWindow; pct: number; deviation: number };
    let strongest: Strongest | undefined;
    for (const w of ["breakfast", "lunch", "dinner"] as TimeWindow[]) {
      const bucket = byWindow[w];
      if (bucket.total < MIN_READINGS_PER_WINDOW) continue;
      const rate = bucket.high / bucket.total;
      const deviation = rate - overallHighRate;
      if (deviation >= TIME_OF_DAY_DEVIATION_THRESHOLD / 100 && (!strongest || deviation > strongest.deviation)) {
        strongest = { window: w, pct: Math.round(rate * 100), deviation };
      }
    }
    if (strongest) tips.push({ kind: "timeOfDay", window: strongest.window, pct: strongest.pct });
  }

  if (entries.length > 0) {
    const gapCutoff = now - 2 * 24 * 60 * 60 * 1000;
    const loggedRecently = entries.some((e) => e.timestamp >= gapCutoff);
    if (!loggedRecently) tips.push({ kind: "loggingGap" });
  }

  return tips.slice(0, 5);
}
