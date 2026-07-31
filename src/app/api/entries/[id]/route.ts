import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { updateEntrySchema } from "@/lib/validation";
import { toEntryDTO } from "../route";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.logEntry.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid entry." }, { status: 400 });
  }
  const input = parsed.data;

  const data: Record<string, unknown> = {};
  if (input.timestamp !== undefined) data.timestamp = new Date(input.timestamp);
  if (input.foods !== undefined) data.foods = JSON.stringify(input.foods);
  if (input.carbs !== undefined) data.carbs = input.carbs;
  if (input.currentBG !== undefined) data.currentBG = input.currentBG;
  if (input.targetBG !== undefined) data.targetBG = input.targetBG;
  if (input.dose !== undefined) data.dose = input.dose;
  if (input.carbsNeeded !== undefined) data.carbsNeeded = input.carbsNeeded;
  if (input.notes !== undefined) data.notes = input.notes || null;

  const updated = await prisma.logEntry.update({ where: { id }, data });
  return NextResponse.json({ entry: toEntryDTO(updated) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;

  const result = await prisma.logEntry.deleteMany({ where: { id, userId } });
  if (result.count === 0) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
