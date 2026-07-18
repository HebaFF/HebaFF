import { createHmac } from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { computeHmac, verifyWebhookHmac } from "./paymob";

// Fixture matching a Paymob "Transaction processed" callback's `obj`. Exact
// values match Paymob's own worked example so this pins the field order,
// not just internal self-consistency: sorted lexicographically by key name.
const FIXTURE_OBJ = {
  amount_cents: 100,
  created_at: "2019-07-01T19:11:36.474927",
  currency: "EGP",
  error_occured: false,
  has_parent_transaction: false,
  id: 8046,
  integration_id: 5215,
  is_3d_secure: false,
  is_auth: false,
  is_capture: false,
  is_refunded: false,
  is_standalone_payment: true,
  is_voided: false,
  order: { id: 6947 },
  owner: 8112,
  pending: false,
  source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
  success: true,
};

function referenceHmac(secret: string) {
  const fields = [
    FIXTURE_OBJ.amount_cents,
    FIXTURE_OBJ.created_at,
    FIXTURE_OBJ.currency,
    FIXTURE_OBJ.error_occured,
    FIXTURE_OBJ.has_parent_transaction,
    FIXTURE_OBJ.id,
    FIXTURE_OBJ.integration_id,
    FIXTURE_OBJ.is_3d_secure,
    FIXTURE_OBJ.is_auth,
    FIXTURE_OBJ.is_capture,
    FIXTURE_OBJ.is_refunded,
    FIXTURE_OBJ.is_standalone_payment,
    FIXTURE_OBJ.is_voided,
    FIXTURE_OBJ.order.id,
    FIXTURE_OBJ.owner,
    FIXTURE_OBJ.pending,
    FIXTURE_OBJ.source_data.pan,
    FIXTURE_OBJ.source_data.sub_type,
    FIXTURE_OBJ.source_data.type,
    FIXTURE_OBJ.success,
  ]
    .map(String)
    .join("");
  return createHmac("sha512", secret).update(fields).digest("hex");
}

describe("computeHmac", () => {
  it("concatenates fields in the documented lexicographic order", () => {
    expect(computeHmac(FIXTURE_OBJ, "test-secret")).toBe(referenceHmac("test-secret"));
  });

  it("produces a different digest for a different secret", () => {
    expect(computeHmac(FIXTURE_OBJ, "test-secret")).not.toBe(computeHmac(FIXTURE_OBJ, "other-secret"));
  });

  it("produces a different digest when any field changes", () => {
    const tampered = { ...FIXTURE_OBJ, amount_cents: 999999 };
    expect(computeHmac(tampered, "test-secret")).not.toBe(computeHmac(FIXTURE_OBJ, "test-secret"));
  });

  it("treats a missing field as an empty string rather than throwing", () => {
    const { pending: _pending, ...withoutPending } = FIXTURE_OBJ;
    expect(() => computeHmac(withoutPending, "test-secret")).not.toThrow();
  });
});

describe("verifyWebhookHmac", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a correctly computed hmac, case-insensitively", () => {
    vi.stubEnv("PAYMOB_HMAC_SECRET", "test-secret");
    const correct = referenceHmac("test-secret");
    expect(verifyWebhookHmac(FIXTURE_OBJ, correct)).toBe(true);
    expect(verifyWebhookHmac(FIXTURE_OBJ, correct.toUpperCase())).toBe(true);
  });

  it("rejects a tampered or wrong hmac", () => {
    vi.stubEnv("PAYMOB_HMAC_SECRET", "test-secret");
    expect(verifyWebhookHmac(FIXTURE_OBJ, "0".repeat(128))).toBe(false);
  });

  it("rejects when PAYMOB_HMAC_SECRET is not configured", () => {
    vi.stubEnv("PAYMOB_HMAC_SECRET", "");
    expect(verifyWebhookHmac(FIXTURE_OBJ, referenceHmac("test-secret"))).toBe(false);
  });

  it("rejects an empty received hmac", () => {
    vi.stubEnv("PAYMOB_HMAC_SECRET", "test-secret");
    expect(verifyWebhookHmac(FIXTURE_OBJ, "")).toBe(false);
  });
});
