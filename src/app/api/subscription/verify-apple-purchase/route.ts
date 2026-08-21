import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { verifyApplePurchaseSchema } from "@/lib/validation";
import { appleAppStoreConfigured, verifyAppleTransaction } from "@/lib/appleAppStore";

// Server-to-server receipt validation for StoreKit purchases — the
// iOS-app counterpart to the Paymob webhook and the Play Billing verify
// route. This is the ONLY place isPremium is ever set to true for an
// AppStore purchase. Never trust the client-side "approved" event on its
// own (see src/lib/applePurchases.ts).
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = verifyApplePurchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  const { jws, productId } = parsed.data;

  if (!appleAppStoreConfigured()) {
    return NextResponse.json({ error: "Apple in-app purchases are not configured yet." }, { status: 503 });
  }

  try {
    const purchase = await verifyAppleTransaction(jws);
    if (purchase.bundleId !== "com.glucodose.app" || purchase.productId !== productId) {
      return NextResponse.json({ error: "Purchase does not match this app or product." }, { status: 400 });
    }
    if (purchase.revoked) {
      return NextResponse.json({ error: "Purchase was refunded or revoked." }, { status: 402 });
    }

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        isPremium: true,
        purchasedAt: new Date(),
        paymentReference: purchase.transactionId,
        paymentProvider: "app_store",
      },
      update: {
        isPremium: true,
        purchasedAt: new Date(),
        paymentReference: purchase.transactionId,
        paymentProvider: "app_store",
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
