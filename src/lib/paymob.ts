import { createHmac } from "crypto";

// Paymob "Accept" API client. Field names/endpoints below are Paymob's
// documented standard-redirect integration (auth -> order -> payment key ->
// iframe redirect). Docs: https://developers.paymob.com — if your dashboard
// shows different required billing_data fields, adjust PAYMOB_BILLING_DATA
// below to match; the auth/order/payment-key call shapes themselves are
// stable across Paymob merchant accounts.
const BASE_URL = "https://accept.paymob.com/api";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export function paymobConfigured(): boolean {
  return !!(
    process.env.PAYMOB_API_KEY &&
    process.env.PAYMOB_INTEGRATION_ID &&
    process.env.PAYMOB_IFRAME_ID &&
    process.env.PAYMOB_HMAC_SECRET &&
    process.env.PAYMOB_AMOUNT_CENTS
  );
}

async function paymobFetch(path: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Paymob ${path} failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function authenticate(): Promise<string> {
  const apiKey = requireEnv("PAYMOB_API_KEY");
  const data = await paymobFetch("/auth/tokens", { api_key: apiKey });
  const token = data.token;
  if (typeof token !== "string") throw new Error("Paymob auth did not return a token.");
  return token;
}

async function createOrder(authToken: string, amountCents: number, currency: string, merchantOrderId: string) {
  const data = await paymobFetch("/ecommerce/orders", {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: amountCents,
    currency,
    items: [],
    merchant_order_id: merchantOrderId,
  });
  const id = data.id;
  if (typeof id !== "number" && typeof id !== "string") throw new Error("Paymob order creation did not return an id.");
  return String(id);
}

export type BillingData = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

// Paymob's billing_data was designed for e-commerce shipping; GlucoDose has
// no physical goods, so the shipping-only fields below are placeholders —
// safe to send, Paymob doesn't validate them against anything.
function buildBillingData(b: BillingData) {
  return {
    first_name: b.firstName || "N/A",
    last_name: b.lastName || "N/A",
    email: b.email || "no-email@example.com",
    phone_number: b.phoneNumber || "+20000000000",
    apartment: "NA",
    floor: "NA",
    street: "NA",
    building: "NA",
    shipping_method: "NA",
    postal_code: "NA",
    city: "NA",
    country: "NA",
    state: "NA",
  };
}

async function createPaymentKey(
  authToken: string,
  amountCents: number,
  currency: string,
  orderId: string,
  billing: BillingData,
): Promise<string> {
  const integrationId = Number(requireEnv("PAYMOB_INTEGRATION_ID"));
  const data = await paymobFetch("/acceptance/payment_keys", {
    auth_token: authToken,
    amount_cents: amountCents,
    expiration: 3600,
    order_id: orderId,
    billing_data: buildBillingData(billing),
    currency,
    integration_id: integrationId,
  });
  const token = data.token;
  if (typeof token !== "string") throw new Error("Paymob payment key request did not return a token.");
  return token;
}

export function iframeUrl(paymentToken: string): string {
  const iframeId = requireEnv("PAYMOB_IFRAME_ID");
  return `${BASE_URL}/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`;
}

// Runs the full auth -> order -> payment-key dance and returns both the
// order id (to correlate against the webhook later) and the iframe URL to
// redirect the user to.
export async function startCheckout(
  merchantOrderId: string,
  billing: BillingData,
): Promise<{ orderId: string; url: string }> {
  const amountCents = Number(requireEnv("PAYMOB_AMOUNT_CENTS"));
  const currency = process.env.PAYMOB_CURRENCY ?? "EGP";

  const authToken = await authenticate();
  const orderId = await createOrder(authToken, amountCents, currency, merchantOrderId);
  const paymentToken = await createPaymentKey(authToken, amountCents, currency, orderId, billing);
  return { orderId, url: iframeUrl(paymentToken) };
}

// HMAC verification for the "Transaction Processed Callback" webhook.
// Paymob's algorithm: sort these exact fields lexicographically by key
// (already listed in that order below), concatenate their *values* as
// strings, HMAC-SHA512 with your HMAC secret, hex-encode lowercase.
const HMAC_FIELD_ORDER = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
] as const;

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

export function computeHmac(transactionObj: Record<string, unknown>, hmacSecret: string): string {
  const concatenated = HMAC_FIELD_ORDER.map((field) => {
    const value = getByPath(transactionObj, field);
    return value === undefined || value === null ? "" : String(value);
  }).join("");
  return createHmac("sha512", hmacSecret).update(concatenated).digest("hex");
}

export function verifyWebhookHmac(transactionObj: Record<string, unknown>, receivedHmac: string): boolean {
  const secret = process.env.PAYMOB_HMAC_SECRET;
  if (!secret || !receivedHmac) return false;
  const computed = computeHmac(transactionObj, secret);
  return computed.toLowerCase() === receivedHmac.toLowerCase();
}
