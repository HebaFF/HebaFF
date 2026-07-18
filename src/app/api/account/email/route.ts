import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { updateEmailSchema } from "@/lib/validation";

export async function PUT(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid email." }, { status: 400 });
  }

  const taken = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (taken && taken.id !== userId) {
    return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
  }

  const user = await prisma.user.update({ where: { id: userId }, data: { email: parsed.data.email } });
  return NextResponse.json({ email: user.email });
}
