import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { paymobConfigured, startCheckout } from "@/lib/paymob";

// Runs Paymob's auth -> order -> payment-key flow for the non-recurring $10
// Premium unlock and returns the iframe URL to redirect the user to.
// Entitlement is only ever flipped by the webhook after Paymob confirms
// payment — never here, and never by the client.
export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true, subscription: true } });
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.subscription?.isPremium) {
    return NextResponse.json({ error: "Already Premium." }, { status: 409 });
  }

  if (!paymobConfigured()) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  }

  const [firstName, ...rest] = (user.profile?.name ?? "").trim().split(/\s+/).filter(Boolean);

  try {
    const { orderId, url } = await startCheckout(userId, {
      firstName: firstName ?? "",
      lastName: rest.join(" "),
      email: user.email ?? "",
      phoneNumber: "",
    });

    await prisma.subscription.upsert({
      where: { userId },
      create: { userId, paymobOrderId: orderId },
      update: { paymobOrderId: orderId },
    });

    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start checkout." },
      { status: 500 },
    );
  }
}
