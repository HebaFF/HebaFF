import { google } from "googleapis";

// Server-side Google Play Developer API client, used to verify a purchase
// token the Android app reports (see /api/subscription/verify-play-purchase)
// against Google's own records — the client-side "approved" event is never
// trusted on its own, same principle as the Paymob webhook's HMAC check.
// Docs: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products
const PACKAGE_NAME = "com.glucodose.app"; // must match capacitor.config.ts appId

export function googlePlayConfigured(): boolean {
  return !!process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
}

function getAuth() {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not set");
  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
}

export type PlayPurchaseState = "purchased" | "cancelled" | "pending";

export type PlayPurchase = {
  state: PlayPurchaseState;
  acknowledged: boolean;
  orderId?: string | null;
};

// purchaseState: 0 = purchased, 1 = cancelled, 2 = pending.
function toPurchaseState(purchaseState: number | null | undefined): PlayPurchaseState {
  if (purchaseState === 0) return "purchased";
  if (purchaseState === 2) return "pending";
  return "cancelled";
}

export async function getProductPurchase(productId: string, purchaseToken: string): Promise<PlayPurchase> {
  const auth = getAuth();
  const androidpublisher = google.androidpublisher({ version: "v3", auth });
  const { data } = await androidpublisher.purchases.products.get({
    packageName: PACKAGE_NAME,
    productId,
    token: purchaseToken,
  });
  return {
    state: toPurchaseState(data.purchaseState),
    // acknowledgementState: 0 = yet to be acknowledged, 1 = acknowledged.
    acknowledged: data.acknowledgementState === 1,
    orderId: data.orderId,
  };
}

// Must be called within 3 days of purchase or Google auto-refunds it.
// Callers should check PlayPurchase.acknowledged first (via
// getProductPurchase) and skip this call if already true — Google's API
// can error on a purchase that's already been acknowledged elsewhere
// (e.g. by the client-side plugin's own native acknowledgePurchase call).
export async function acknowledgeProductPurchase(productId: string, purchaseToken: string): Promise<void> {
  const auth = getAuth();
  const androidpublisher = google.androidpublisher({ version: "v3", auth });
  await androidpublisher.purchases.products.acknowledge({
    packageName: PACKAGE_NAME,
    productId,
    token: purchaseToken,
  });
}
