import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";
import { computeRatios, toProfileDTO } from "@/lib/profileDto";

export async function PUT(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid profile." }, { status: 400 });
  }
  const input = parsed.data;
  const { carbRatio, isf } = computeRatios(input);

  const usesInsulin = input.treatmentMode === "insulin" || input.treatmentMode === "both";

  const data = {
    name: input.name,
    gender: input.gender,
    age: input.age,
    diagnosisDate: new Date(input.diagnosisDate),
    diabetesType: input.diabetesType,
    units: input.units,
    treatmentMode: input.treatmentMode,
    insulinDelivery: usesInsulin ? input.insulinDelivery ?? "injections" : null,
    rapidInsulinType: usesInsulin ? input.rapidType ?? null : null,
    rapidUnitsPerDay: usesInsulin ? input.rapidUnits ?? null : null,
    rapidActionMinutes: input.rapidActionMinutes ?? 240,
    basalInsulinType: usesInsulin ? input.basalType ?? null : null,
    basalUnitsPerDay: usesInsulin ? input.basalUnits ?? null : null,
    pills: JSON.stringify(input.pills ?? []),
    carbRatio,
    isf,
    carbRatioOverridden: input.carbRatioOverridden,
  };

  const profile = await prisma.profile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return NextResponse.json({ profile: toProfileDTO(profile) });
}
