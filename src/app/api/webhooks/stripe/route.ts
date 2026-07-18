import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// Server-to-server receipt validation: this is the ONLY place is_premium is
// ever set to true. Never trust a client-set flag for entitlement.
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id ?? session.metadata?.userId;
    if (userId && session.payment_status === "paid") {
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          isPremium: true,
          purchasedAt: new Date(),
          paymentReference: typeof session.payment_intent === "string" ? session.payment_intent : session.id,
          stripeSessionId: session.id,
        },
        update: {
          isPremium: true,
          purchasedAt: new Date(),
          paymentReference: typeof session.payment_intent === "string" ? session.payment_intent : session.id,
          stripeSessionId: session.id,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
