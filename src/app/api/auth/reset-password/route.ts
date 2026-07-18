import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, hashResetToken, setSessionCookie } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validation";
import { checkRateLimit, clientIp, rateLimitedResponse } from "@/lib/rateLimit";

// Tokens are 256-bit random and single-use, so brute-forcing one is already
// infeasible — this is just defense in depth against scripted abuse.
const RESET_LIMIT = { limit: 20, windowMs: 60 * 60 * 1000 };

export async function POST(req: NextRequest) {
  const rateCheck = checkRateLimit(`reset:ip:${clientIp(req)}`, RESET_LIMIT.limit, RESET_LIMIT.windowMs);
  if (!rateCheck.allowed) return rateLimitedResponse(rateCheck.retryAfterSeconds);

  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const tokenHash = hashResetToken(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Invalidate any other outstanding reset links for this account.
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, id: { not: record.id }, usedAt: null },
    }),
  ]);

  await setSessionCookie(record.userId);
  return NextResponse.json({ ok: true });
}
