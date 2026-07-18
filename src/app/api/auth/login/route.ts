import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in both fields." }, { status: 400 });
  }
  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username: username.trim() } });
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  await setSessionCookie(user.id);
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ id: user.id, username: user.username, hasProfile: !!profile });
}
