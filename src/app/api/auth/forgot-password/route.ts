import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateResetToken } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/validation";
import { sendEmail, passwordResetEmail } from "@/lib/email";

const GENERIC_RESPONSE = { ok: true, message: "If that email is registered, we've sent a reset link." };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    // Still respond generically to avoid leaking which emails are registered.
    return NextResponse.json(GENERIC_RESPONSE);
  }

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
