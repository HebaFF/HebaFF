import { Capacitor } from "@capacitor/core";

// Digital goods purchased *inside* the native Android app must go through
// Google Play Billing per Play policy — the website and iOS (later) keep
// using Paymob unchanged. This is the single place that distinguishes the
// native Android build from everything else; reuse it rather than checking
// Capacitor directly elsewhere.
export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}
