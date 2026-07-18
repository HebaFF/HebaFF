import { NextResponse } from "next/server";

// In-memory fixed-window rate limiter. Good enough for a single-instance
// deployment; if you run multiple instances (serverless, multi-region), swap
// this module's internals for a shared store (e.g. Upstash Redis) — the
// checkRateLimit() call signature below is deliberately storage-agnostic so
// call sites don't need to change.
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Lazily sweep expired buckets so memory doesn't grow unbounded between
// restarts in long-lived dev/single-instance processes.
function sweep(now: number) {
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt <= now) buckets.delete(key);
  });
}
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (now - lastSweep > SWEEP_INTERVAL_MS) {
    sweep(now);
    lastSweep = now;
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many attempts. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
