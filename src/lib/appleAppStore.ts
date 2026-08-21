import { SignedDataVerifier, Environment, VerificationException } from "@apple/app-store-server-library";

// Server-side StoreKit purchase verification, used to check a signed
// transaction (JWS) the iOS app reports (see
// /api/subscription/verify-apple-purchase) against Apple's own root
// certificate — the client-side "approved" event is never trusted on its
// own, same principle as the Paymob webhook's HMAC check and the Play
// Developer API check.
//
// Unlike Play Billing, this needs no per-app service-account credentials —
// verification is pure cryptographic signature checking against Apple's
// public root CA, done entirely offline. The one external prerequisite is
// Apple's root certificate itself (see APPLE_ROOT_CA_G3_BASE64 below).
// Docs: https://github.com/apple/app-store-server-library-node
const BUNDLE_ID = "com.glucodose.app"; // must match capacitor.config.ts appId

export function appleAppStoreConfigured(): boolean {
  return !!process.env.APPLE_ROOT_CA_G3_BASE64;
}

function loadRootCertificate(): Buffer {
  const b64 = process.env.APPLE_ROOT_CA_G3_BASE64;
  if (!b64) throw new Error("APPLE_ROOT_CA_G3_BASE64 is not set");
  return Buffer.from(b64, "base64");
}

function buildVerifier(environment: Environment): SignedDataVerifier {
  // enableOnlineChecks (revocation + expiry checks against the current
  // date) is on — this is a purchase-entitlement check, not a one-off
  // debug decode, so we want the strictest validation available.
  return new SignedDataVerifier([loadRootCertificate()], true, environment, BUNDLE_ID);
}

export type ApplePurchase = {
  productId?: string;
  transactionId?: string;
  bundleId?: string;
  revoked: boolean;
};

// Apple doesn't tell us upfront whether a transaction was signed in the
// Sandbox or Production environment (App Review itself purchases through
// Sandbox even though the app is "in production"), so — same dance as the
// old verifyReceipt REST endpoint — try Production first and fall back to
// Sandbox only on an environment-mismatch failure.
export async function verifyAppleTransaction(jws: string): Promise<ApplePurchase> {
  try {
    const payload = await buildVerifier(Environment.PRODUCTION).verifyAndDecodeTransaction(jws);
    return toApplePurchase(payload);
  } catch (err) {
    if (!(err instanceof VerificationException)) throw err;
    const payload = await buildVerifier(Environment.SANDBOX).verifyAndDecodeTransaction(jws);
    return toApplePurchase(payload);
  }
}

function toApplePurchase(payload: {
  productId?: string;
  transactionId?: string;
  bundleId?: string;
  revocationDate?: number;
}): ApplePurchase {
  return {
    productId: payload.productId,
    transactionId: payload.transactionId,
    bundleId: payload.bundleId,
    revoked: payload.revocationDate != null,
  };
}
