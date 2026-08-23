import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/validation";
import { checkRateLimit, clientIp, rateLimitedResponse } from "@/lib/rateLimit";

// Blunts scripted mass account creation from a single source.
const SIGNUP_LIMIT = { limit: 8, windowMs: 60 * 60 * 1000 };

export async function POST(req: NextRequest) {
  const rateCheck = checkRateLimit(`signup:ip:${clientIp(req)}`, SIGNUP_LIMIT.limit, SIGNUP_LIMIT.windowMs);
  if (!rateCheck.allowed) return rateLimitedResponse(rateCheck.retryAfterSeconds);

  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const { username, password, email } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "That username is taken — try logging in instead." }, { status: 409 });
  }
  const emailTaken = await prisma.user.findUnique({ where: { email } });
  if (emailTaken) {
    return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      // The free trial starts immediately at signup (not on a manual "Start
      // trial" click) — every account gets TRIAL_DAYS of full access, then
      // the (app) layout's paywall guard takes over. See
      // src/app/(app)/layout.tsx for where trialUsed/trialStartedAt are
      // read back to decide access.
      subscription: { create: { trialUsed: true, trialStartedAt: new Date() } },
    },
  });

  await setSessionCookie(user.id);
  return NextResponse.json({ id: user.id, username: user.username, hasProfile: false });
}
