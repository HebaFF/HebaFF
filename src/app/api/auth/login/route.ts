import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { checkRateLimit, clientIp, rateLimitedResponse } from "@/lib/rateLimit";

// Two limits: per-IP (blunts a single attacker trying many usernames) and
// per-username (blunts credential stuffing spread across many IPs).
const IP_LIMIT = { limit: 20, windowMs: 15 * 60 * 1000 };
const USERNAME_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in both fields." }, { status: 400 });
  }
  const { username, password } = parsed.data;

  const ipCheck = checkRateLimit(`login:ip:${clientIp(req)}`, IP_LIMIT.limit, IP_LIMIT.windowMs);
  if (!ipCheck.allowed) return rateLimitedResponse(ipCheck.retryAfterSeconds);
  const usernameCheck = checkRateLimit(
    `login:user:${username.trim().toLowerCase()}`,
    USERNAME_LIMIT.limit,
    USERNAME_LIMIT.windowMs,
  );
  if (!usernameCheck.allowed) return rateLimitedResponse(usernameCheck.retryAfterSeconds);

  const user = await prisma.user.findUnique({ where: { username: username.trim() } });
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  await setSessionCookie(user.id);
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ id: user.id, username: user.username, hasProfile: !!profile });
}
