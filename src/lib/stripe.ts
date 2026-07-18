import Stripe from "stripe";

let _stripe: Stripe | null = null;

// Lazily constructed so the app can boot (e.g. for local dev without Stripe
// configured yet) and only fails when a Stripe-dependent route is actually hit.
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key, { apiVersion: "2024-06-20" });
  return _stripe;
}
