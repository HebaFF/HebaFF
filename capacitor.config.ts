import type { CapacitorConfig } from "@capacitor/cli";

// Wraps the deployed GlucoDose website in a native shell — Capacitor loads
// `server.url` in a WebView rather than bundling static files, since this
// app has a real backend (API routes, Prisma, auth) that has to be reached
// over the network either way. Points at the Railway deployment, which
// stays up independent of any local machine; see README.md "Deploying"
// for the full walkthrough.
const config: CapacitorConfig = {
  appId: "com.glucodose.app",
  appName: "GlucoDose",
  webDir: "public",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://hebaff-production.up.railway.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
