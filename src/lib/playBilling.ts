"use client";

import { store, ProductType, Platform, type Transaction } from "capacitor-plugin-cdv-purchase";
import { api } from "@/lib/api";

// Google Play policy requires digital goods bought inside the Android app
// to go through Play Billing, not Paymob — see src/lib/platform.ts and
// premium/page.tsx for where this is branched in. Only ever called when
// isAndroidNative() is true; safe to import anywhere (no window/document
// access happens until these functions actually run).
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

  store.register([{ id: PREMIUM_PRODUCT_ID, platform: Platform.GOOGLE_PLAY, type: ProductType.NON_CONSUMABLE }]);

  // The one place a Play-approved transaction (fresh purchase OR restore)
  // becomes real entitlement: our server checks it against the Play
  // Developer API and acknowledges it there, within Google's 3-day
  // window. The client-side "approved" event alone is never trusted —
  // same principle as never trusting Paymob's client-side redirect.
  store.when().approved(async (transaction: Transaction) => {
    try {
      const productId = transaction.products[0]?.id ?? PREMIUM_PRODUCT_ID;
      // The base Transaction type doesn't declare purchaseToken (it's
      // GooglePlay-specific), so read it via a narrow cast.
      const purchaseToken = (transaction as unknown as { purchaseToken?: string }).purchaseToken;
      if (!purchaseToken) throw new Error("Missing purchase token.");
      await api.verifyPlayPurchase(purchaseToken, productId);
      await transaction.finish();
      verifiedListeners.forEach((cb) => cb());
    } catch {
      failedListeners.forEach((cb) => cb("Could not verify your purchase. Please try again or contact support."));
    }
  });

  store.initialize([{ platform: Platform.GOOGLE_PLAY }]);
}

// Resolves with an error message on failure (including "cancelled by
// user"), or undefined once the purchase flow has been *initiated*
// successfully — actual entitlement lands asynchronously via
// onPurchaseVerified/onPurchaseFailed once our server responds.
export function purchasePremium(): Promise<string | undefined> {
  ensureInitialized();
  const product = store.get(PREMIUM_PRODUCT_ID, Platform.GOOGLE_PLAY);
  const offer = product?.getOffer();
  if (!offer) return Promise.resolve("Product not available yet — please try again in a moment.");
  return offer.order().then((err) => err?.message);
}

export function restorePlayPurchases(): Promise<string | undefined> {
  ensureInitialized();
  return store.restorePurchases().then((err) => err?.message);
}
