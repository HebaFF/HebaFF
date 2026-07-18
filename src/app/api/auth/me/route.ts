import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { toProfileDTO } from "@/lib/profileDto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      profile: user.profile ? toProfileDTO(user.profile) : null,
      subscription: user.subscription
        ? {
            isPremium: user.subscription.isPremium,
            trialUsed: user.subscription.trialUsed,
            trialStartedAt: user.subscription.trialStartedAt?.getTime() ?? null,
          }
        : { isPremium: false, trialUsed: false, trialStartedAt: null },
    },
  });
}
