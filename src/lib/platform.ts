import { Capacitor } from "@capacitor/core";

// Digital goods purchased *inside* a native app must go through the
// platform's own billing system per store policy — the website keeps using
// Paymob unchanged. These are the single places that distinguish each
// native build from everything else; reuse them rather than checking
// Capacitor directly elsewhere.
export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export function isIOSNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}
