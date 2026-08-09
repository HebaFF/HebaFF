"use client";

import { Card } from "@/components/ui";
import { WarningIcon, UtensilsIcon, CalendarIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { useLang } from "@/context/LangContext";
import { generateTips, type Tip } from "@/lib/tips";

// Community was pulled from the UI ahead of the first Play Store submission
// — it had no block/report/moderation tools, which is both a content-rating
// and a real safety concern for a public feed inside a health app. The
// backend (src/app/api/community/route.ts, the CommunityPost model, and the
// client methods in src/lib/api.ts) is untouched, so this can come back once
// basic moderation exists — see git history for the prior version of this
// page with the Tips/Community segmented toggle.

function tipText(tip: Tip, T: ReturnType<typeof useLang>["t"]["tips"]): { icon: React.ReactNode; text: string; bg: string } {
  switch (tip.kind) {
    case "timeInRangeHigh":
      return { icon: <WarningIcon color="var(--warn)" />, text: T.timeInRangeHighTip(tip.pct), bg: "var(--warn-tint)" };
    case "timeInRangeLow":
      return { icon: <WarningIcon color="var(--danger)" />, text: T.timeInRangeLowTip(tip.pct), bg: "var(--danger-tint)" };
    case "timeOfDay": {
      const windowLabel =
        tip.window === "breakfast" ? T.windowBreakfast : tip.window === "lunch" ? T.windowLunch : tip.window === "dinner" ? T.windowDinner : T.windowOther;
      return { icon: <UtensilsIcon color="var(--primary)" />, text: T.timeOfDayTip(windowLabel, tip.pct), bg: "var(--primary-tint)" };
    }
    case "loggingGap":
      return { icon: <CalendarIcon color="var(--text-2)" />, text: T.loggingGapTip, bg: "var(--surface-2)" };
  }
}

export default function CarePage() {
  const { user } = useAuth();
  const { entries } = useAppData();
  const { t } = useLang();
  const T = t.tips;

  if (!user?.profile) return null;
  const tips = generateTips(entries, user.profile.units);

  return (
    <div style={{ padding: "6px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800 }}>{t.nav.care}</div>

      {tips.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 28 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{T.emptyTitle}</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>{T.emptyDesc}</div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tips.map((tip, i) => {
            const { icon, text, bg } = tipText(tip, T);
            return (
              <Card key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: bg, border: "none" }}>
                <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>{text}</span>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
