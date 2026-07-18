import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, clientIp } from "./rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit within the window", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 1000).allowed).toBe(true);
    }
  });

  it("blocks the request once the limit is exceeded", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 1000);
    const result = checkRateLimit(key, 5, 1000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 1000);
    expect(checkRateLimit(key, 5, 1000).allowed).toBe(false);

    vi.setSystemTime(1001);
    expect(checkRateLimit(key, 5, 1000).allowed).toBe(true);
  });

  it("tracks separate keys independently", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    for (let i = 0; i < 5; i++) checkRateLimit(a, 5, 1000);
    expect(checkRateLimit(a, 5, 1000).allowed).toBe(false);
    expect(checkRateLimit(b, 5, 1000).allowed).toBe(true);
  });
});

describe("clientIp", () => {
  it("prefers the first entry in x-forwarded-for", () => {
    const req = new Request("http://localhost", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(clientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("http://localhost", { headers: { "x-real-ip": "9.9.9.9" } });
    expect(clientIp(req)).toBe("9.9.9.9");
  });

  it("falls back to unknown when no headers are present", () => {
    const req = new Request("http://localhost");
    expect(clientIp(req)).toBe("unknown");
  });
});
