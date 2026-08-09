import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookHmac } from "@/lib/paymob";

// Server-to-server receipt validation: this is the ONLY place is_premium is
// ever set to true. Never trust the client-side iframe redirect for
// entitlement. Configure this URL as the "Transaction processed callback"
// in your Paymob integration settings — Paymob appends ?hmac=... to it.
export async function POST(req: NextRequest) {
  const hmac = req.nextUrl.searchParams.get("hmac") ?? "";

  const body = await req.json().catch(() => null);
  const obj = body?.obj;
  if (!obj || typeof obj !== "object") {
    return NextResponse.json({ error: "Malformed payload." }, { status: 400 });
  }

  if (!verifyWebhookHmac(obj, hmac)) {
    return NextResponse.json({ error: "HMAC verification failed." }, { status: 400 });
  }

  const orderId = obj?.order?.id != null ? String(obj.order.id) : null;
  if (orderId && obj.success === true) {
    const subscription = await prisma.subscription.findFirst({ where: { paymobOrderId: orderId } });
    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          isPremium: true,
          purchasedAt: new Date(),
          paymentReference: obj.id != null ? String(obj.id) : null,
          paymentProvider: "paymob",
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
