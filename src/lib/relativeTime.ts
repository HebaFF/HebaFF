export function formatRelativeTime(
  ts: number,
  now: number,
  T: { justNow: string; minutesAgo: (n: number) => string; hoursAgo: (n: number) => string; daysAgo: (n: number) => string },
) {
  const diffMs = now - ts;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return T.justNow;
  if (minutes < 60) return T.minutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return T.hoursAgo(hours);
  return T.daysAgo(Math.floor(hours / 24));
}
