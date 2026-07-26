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
  ios: {
    contentInset: "always",
  },
};

export default config;
