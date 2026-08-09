import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId, clearSessionCookie } from "@/lib/auth";

// Deletes the account and everything tied to it — Profile, LogEntry,
// CustomFood, Subscription, PasswordResetToken, CommunityPost all cascade
// via `onDelete: Cascade` on their User relation (see prisma/schema.prisma).
// Required by Google Play / App Store policy: any app with account creation
// must offer a way to delete the account and its data.
export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await prisma.user.delete({ where: { id: userId } });
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
