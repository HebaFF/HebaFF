"use client";

import { Card } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { useLang } from "@/context/LangContext";
import { generateTips, type Tip } from "@/lib/tips";

function tipText(tip: Tip, T: ReturnType<typeof useLang>["t"]["tips"]): { icon: string; text: string } {
  switch (tip.kind) {
    case "timeInRangeHigh":
      return { icon: "⚠️", text: T.timeInRangeHighTip(tip.pct) };
    case "timeInRangeLow":
      return { icon: "⚠️", text: T.timeInRangeLowTip(tip.pct) };
    case "timeOfDay": {
      const windowLabel =
        tip.window === "breakfast" ? T.windowBreakfast : tip.window === "lunch" ? T.windowLunch : tip.window === "dinner" ? T.windowDinner : T.windowOther;
      return { icon: "🍽️", text: T.timeOfDayTip(windowLabel, tip.pct) };
    }
    case "loggingGap":
      return { icon: "📆", text: T.loggingGapTip };
  }
}

export default function TipsPage() {
  const { user } = useAuth();
  const { entries } = useAppData();
  const { t } = useLang();
  const T = t.tips;

  if (!user?.profile) return null;
  const tips = generateTips(entries, user.profile.units);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800 }}>{T.title}</div>
        <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>{T.subtitle}</div>
      </div>

      {tips.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 28 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{T.emptyTitle}</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>{T.emptyDesc}</div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tips.map((tip, i) => {
            const { icon, text } = tipText(tip, T);
            return (
              <Card key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <span style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>{text}</span>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
