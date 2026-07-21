import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { logEntrySchema } from "@/lib/validation";

function toEntryDTO(e: {
  id: string;
  type: string;
  timestamp: Date;
  foods: string | null;
  carbs: number | null;
  currentBG: number | null;
  targetBG: number | null;
  dose: number | null;
  carbsNeeded: number | null;
  notes: string | null;
}) {
  return {
    id: e.id,
    type: e.type,
    timestamp: e.timestamp.getTime(),
    foods: e.foods ? JSON.parse(e.foods) : undefined,
    carbs: e.carbs ?? undefined,
    currentBG: e.currentBG ?? undefined,
    targetBG: e.targetBG ?? undefined,
    dose: e.dose ?? undefined,
    carbsNeeded: e.carbsNeeded ?? undefined,
    notes: e.notes ?? undefined,
  };
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const entries = await prisma.logEntry.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
  });
  return NextResponse.json({ entries: entries.map(toEntryDTO) });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = logEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid entry." }, { status: 400 });
  }
  const input = parsed.data;

  const entry = await prisma.logEntry.create({
    data: {
      userId,
      type: input.type,
      timestamp: new Date(input.timestamp ?? Date.now()),
      foods: input.foods ? JSON.stringify(input.foods) : null,
      carbs: input.carbs ?? null,
      currentBG: input.currentBG ?? null,
      targetBG: input.targetBG ?? null,
      dose: input.dose ?? null,
      carbsNeeded: input.carbsNeeded ?? null,
      notes: input.notes || null,
    },
  });

  return NextResponse.json({ entry: toEntryDTO(entry) });
}
