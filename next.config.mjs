/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets the dev server accept requests from the ngrok tunnel origin (used
  // for testing on a phone / the Capacitor iOS shell) instead of only
  // localhost. Safe for local dev only — this file isn't used in production
  // builds (see vercel-build in package.json).
  allowedDevOrigins: ["tradition-sharpie-gurgling.ngrok-free.dev"],
};

export default nextConfig;
