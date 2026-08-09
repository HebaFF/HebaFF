import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

// One-time free trial (see TRIAL_DAYS in constants.ts), available once per
// account. Trial state is
// server-authoritative — the client cannot flip trialUsed/trialStartedAt
// directly, only trigger this endpoint.
export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (sub?.isPremium) {
    return NextResponse.json({ error: "Already Premium." }, { status: 409 });
  }
  if (sub?.trialUsed) {
    return NextResponse.json({ error: "Trial already used." }, { status: 409 });
  }

  const updated = await prisma.subscription.upsert({
    where: { userId },
    create: { userId, trialUsed: true, trialStartedAt: new Date() },
    update: { trialUsed: true, trialStartedAt: new Date() },
  });

  return NextResponse.json({
    isPremium: updated.isPremium,
    trialUsed: updated.trialUsed,
    trialStartedAt: updated.trialStartedAt?.getTime() ?? null,
  });
}
