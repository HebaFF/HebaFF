import type { LogEntry } from "./api";

// Simplified linear decay — not a clinically-validated IOB curve (real pumps
// use bilinear/exponential models). Good enough for an at-a-glance estimate;
// flagged as such wherever it's displayed.
const RAPID_ACTION_MINUTES = 240; // typical rapid-acting insulin duration
const CARB_ABSORPTION_MINUTES = 180; // typical carb absorption window

function activeFraction(elapsedMinutes: number, windowMinutes: number): number {
  if (elapsedMinutes < 0 || elapsedMinutes >= windowMinutes) return 0;
  return 1 - elapsedMinutes / windowMinutes;
}

export function computeActiveInsulin(entries: LogEntry[], now: number, actionMinutes: number = RAPID_ACTION_MINUTES): number {
  const total = entries.reduce((sum, e) => {
    if (e.dose === undefined) return sum;
    return sum + e.dose * activeFraction((now - e.timestamp) / 60000, actionMinutes);
  }, 0);
  return Math.round(total * 10) / 10;
}

export function computeActiveCarbs(entries: LogEntry[], now: number, carbMinutes: number = CARB_ABSORPTION_MINUTES): number {
  const total = entries.reduce((sum, e) => {
    if (e.carbs === undefined) return sum;
    return sum + e.carbs * activeFraction((now - e.timestamp) / 60000, carbMinutes);
  }, 0);
  return Math.round(total);
}
