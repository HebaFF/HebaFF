import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

// Creates a Stripe Checkout Session in one-time "payment" mode (NOT
// "subscription" mode) for the non-recurring $29.99 Premium unlock.
// Entitlement is only ever flipped by the webhook after Stripe confirms
// payment — never here, and never by the client.
export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } });
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.subscription?.isPremium) {
    return NextResponse.json({ error: "Already Premium." }, { status: 409 });
  }

  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (!priceId) {
    return NextResponse.json(
      { error: "Payments are not configured yet (STRIPE_PREMIUM_PRICE_ID missing)." },
      { status: 503 },
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      metadata: { userId },
      success_url: `${appUrl}/premium?checkout=success`,
      cancel_url: `${appUrl}/premium?checkout=cancelled`,
    });

    await prisma.subscription.upsert({
      where: { userId },
      create: { userId, stripeSessionId: session.id },
      update: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start checkout." },
      { status: 500 },
    );
  }
}
