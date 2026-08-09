import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { verifyPlayPurchaseSchema } from "@/lib/validation";
import { googlePlayConfigured, getProductPurchase, acknowledgeProductPurchase } from "@/lib/googlePlay";

// Server-to-server receipt validation for Google Play Billing purchases —
// the Android-app counterpart to the Paymob webhook. This is the ONLY place
// isPremium is ever set to true for a Play purchase. Never trust the
// client-side "approved" event on its own (see src/lib/playBilling.ts).
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = verifyPlayPurchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  const { purchaseToken, productId } = parsed.data;

  if (!googlePlayConfigured()) {
    return NextResponse.json({ error: "Google Play billing is not configured yet." }, { status: 503 });
  }

  try {
    const purchase = await getProductPurchase(productId, purchaseToken);
    if (purchase.state !== "purchased") {
      return NextResponse.json({ error: "Purchase is not in a completed state." }, { status: 402 });
    }

    // Acknowledge within Google's 3-day window, or they auto-refund. Skip
    // if already acknowledged (e.g. by the client plugin) — re-acknowledging
    // via the Developer API can error on an already-acknowledged purchase.
    if (!purchase.acknowledged) {
      await acknowledgeProductPurchase(productId, purchaseToken);
    }

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        isPremium: true,
        purchasedAt: new Date(),
        paymentReference: purchaseToken,
        paymentProvider: "play_billing",
      },
      update: {
        isPremium: true,
        purchasedAt: new Date(),
        paymentReference: purchaseToken,
        paymentProvider: "play_billing",
      },
    });

    return NextResponse.json({ isPremium: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not verify purchase." },
      { status: 500 },
    );
  }
}
