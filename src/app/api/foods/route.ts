import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { customFoodSchema } from "@/lib/validation";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const foods = await prisma.customFood.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    foods: foods.map((f) => ({
      id: f.id,
      name: f.name,
      category: f.category,
      portion: f.portion,
      carbs: f.carbs,
      custom: true,
    })),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = customFoodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid food." }, { status: 400 });
  }

  const food = await prisma.customFood.create({ data: { userId, ...parsed.data } });
  return NextResponse.json({
    food: { id: food.id, name: food.name, category: food.category, portion: food.portion, carbs: food.carbs, custom: true },
  });
}
