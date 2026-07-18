import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateResetToken } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/validation";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { checkRateLimit, clientIp, rateLimitedResponse } from "@/lib/rateLimit";

const GENERIC_RESPONSE = { ok: true, message: "If that email is registered, we've sent a reset link." };

// Per-IP blunts scripted enumeration/spam; per-email stops one account's
// inbox from being flooded with reset emails triggered from many IPs.
const IP_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };
const EMAIL_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

export async function POST(req: NextRequest) {
  const ipCheck = checkRateLimit(`forgot:ip:${clientIp(req)}`, IP_LIMIT.limit, IP_LIMIT.windowMs);
  if (!ipCheck.allowed) return rateLimitedResponse(ipCheck.retryAfterSeconds);

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    // Still respond generically to avoid leaking which emails are registered.
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const emailCheck = checkRateLimit(`forgot:email:${parsed.data.email}`, EMAIL_LIMIT.limit, EMAIL_LIMIT.windowMs);
  if (!emailCheck.allowed) return NextResponse.json(GENERIC_RESPONSE);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const { token, tokenHash, expiresAt } = generateResetToken();
  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  const { subject, html, text } = passwordResetEmail(resetUrl);
  await sendEmail(user.email!, subject, html, text);

  // In dev (no real email provider configured) also hand back the link
  // directly so the flow is testable without an inbox. Never in production.
  const devUrl = process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY ? resetUrl : undefined;
  return NextResponse.json({ ...GENERIC_RESPONSE, devResetUrl: devUrl });
}
