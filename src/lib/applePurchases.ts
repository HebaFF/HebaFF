"use client";

import { store, ProductType, Platform, type Transaction } from "capacitor-plugin-cdv-purchase";
import { api } from "@/lib/api";

// Apple policy requires digital goods bought inside the iOS app to go
// through StoreKit, not Paymob — see src/lib/platform.ts and
// premium/page.tsx for where this is branched in. Only ever called when
// isIOSNative() is true; safe to import anywhere (no window/document
// access happens until these functions actually run). Same product id as
// the Android side — it's just a string key, not shared infrastructure.
export const PREMIUM_PRODUCT_ID = "premium_lifetime";

type Listener = () => void;
type FailListener = (message: string) => void;
const verifiedListeners = new Set<Listener>();
const failedListeners = new Set<FailListener>();

// Components subscribe to learn when a purchase (fresh or restored) has
// been verified by our server and is safe to treat as isPremium.
export function onPurchaseVerified(cb: Listener): () => void {
  verifiedListeners.add(cb);
  return () => verifiedListeners.delete(cb);
}

export function onPurchaseFailed(cb: FailListener): () => void {
  failedListeners.add(cb);
  return () => failedListeners.delete(cb);
}

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  store.register([{ id: PREMIUM_PRODUCT_ID, platform: Platform.APPLE_APPSTORE, type: ProductType.NON_CONSUMABLE }]);

  // The one place an AppStore-approved transaction (fresh purchase OR
  // restore) becomes real entitlement: our server verifies the signed
  // transaction (JWS) against Apple's own root certificate and decodes it
  // there. The client-side "approved" event alone is never trusted — same
  // principle as never trusting Paymob's client-side redirect, or Play's.
  store.when().approved(async (transaction: Transaction) => {
    try {
      const productId = transaction.products[0]?.id ?? PREMIUM_PRODUCT_ID;
      // The base Transaction type doesn't declare jwsRepresentation (it's
      // StoreKit-2-specific), so read it via a narrow cast.
      const jws = (transaction as unknown as { jwsRepresentation?: string }).jwsRepresentation;
      if (!jws) throw new Error("Missing signed transaction.");
      await api.verifyApplePurchase(jws, productId);
      await transaction.finish();
      verifiedListeners.forEach((cb) => cb());
    } catch {
      failedListeners.forEach((cb) => cb("Could not verify your purchase. Please try again or contact support."));
    }
  });

  store.initialize([{ platform: Platform.APPLE_APPSTORE }]);
}

// Resolves with an error message on failure (including "cancelled by
// user"), or undefined once the purchase flow has been *initiated*
// successfully — actual entitlement lands asynchronously via
// onPurchaseVerified/onPurchaseFailed once our server responds.
export function purchaseApplePremium(): Promise<string | undefined> {
  ensureInitialized();
  const product = store.get(PREMIUM_PRODUCT_ID, Platform.APPLE_APPSTORE);
  const offer = product?.getOffer();
  if (!offer) return Promise.resolve("Product not available yet — please try again in a moment.");
  return offer.order().then((err) => err?.message);
}

export function restoreApplePurchases(): Promise<string | undefined> {
  ensureInitialized();
  return store.restorePurchases().then((err) => err?.message);
}
