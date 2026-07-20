import type { LogEntry } from "./api";

const POINTS_PER_ENTRY = 10;

function dayKey(timestamp: number): string {
  return new Date(timestamp).toDateString();
}

// Consecutive days (counting back from today) with at least one logged entry.
export function computeStreak(entries: LogEntry[], now = Date.now()): number {
  const loggedDays = new Set(entries.map((e) => dayKey(e.timestamp)));
  let streak = 0;
  let cursor = now;
  while (loggedDays.has(dayKey(cursor))) {
    streak += 1;
    cursor -= 24 * 60 * 60 * 1000;
  }
  return streak;
}

export function computePoints(entries: LogEntry[]): number {
  return entries.length * POINTS_PER_ENTRY;
}
