import type { CapacitorConfig } from "@capacitor/cli";

// Wraps the deployed GlucoDose website in a native shell — Capacitor loads
// `server.url` in a WebView rather than bundling static files, since this
// app has a real backend (API routes, Prisma, auth) that has to be reached
// over the network either way. Update `server.url` once the site is live;
// see README.md "Deploying to iOS (TestFlight)" for the full walkthrough.
const config: CapacitorConfig = {
  appId: "com.glucodose.app",
  appName: "GlucoDose",
  webDir: "public",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://tradition-sharpie-gurgling.ngrok-free.dev",
    cleartext: false,
  },
  // A fully custom (non-browser-looking) User-Agent makes ngrok's free tier
  // skip its "abuse prevention" browser-warning interstitial on every
  // request (this is ngrok's own documented bypass) — otherwise it reappears
  // on every fresh app launch since a new WebView session has no cookie yet.
  // Appending to the default UA isn't enough since it still contains
  // recognizable browser tokens (Safari/Mozilla) that ngrok matches on.
  overrideUserAgent: "GlucoDoseApp/1.0",
  ios: {
    contentInset: "always",
  },
};

export default config;
