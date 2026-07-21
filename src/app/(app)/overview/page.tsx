"use client";

import { RingProgress, StatTile } from "@/components/ui";
import { FireIcon, StarIcon, TrendUpIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { useLang } from "@/context/LangContext";
import { classifyBG } from "@/lib/calc";
import { computeStreak, computePoints } from "@/lib/gamification";

export default function OverviewPage() {
  const { user } = useAuth();
  const { entries } = useAppData();
  const { t } = useLang();
  const T = t.dashboard;

  if (!user?.profile) return null;
  const profile = user.profile;

  // eslint-disable-next-line react-hooks/purity -- millisecond-scale render-time drift is inconsequential for a 7-day filter cutoff
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const readings = entries.filter((e) => e.timestamp >= cutoff && e.currentBG !== undefined);
  const inRangeCount = readings.filter((e) => classifyBG(e.currentBG!, profile.units) === "inRange").length;
  const tirPct = readings.length ? Math.round((inRangeCount / readings.length) * 100) : 0;
  const lastBG = [...entries].reverse().find((e) => e.currentBG !== undefined);

  const streak = computeStreak(entries);
  const points = computePoints(entries);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          margin: "-6px -20px 0",
          padding: "32px 20px 22px",
          background: "linear-gradient(180deg, var(--primary-tint) 0%, var(--bg) 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <RingProgress
          pct={tirPct}
          value={lastBG ? lastBG.currentBG : t.common.dash}
          unit={lastBG ? (profile.units === "mmol" ? "mmol/L" : "mg/dL") : undefined}
          status={readings.length ? (tirPct >= 70 ? T.green : tirPct >= 40 ? T.fair : T.needsAttention) : T.noData}
          color={tirPct >= 70 ? "var(--good)" : tirPct >= 40 ? "var(--warn)" : "var(--danger)"}
          size={176}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--text-3)", fontWeight: 700 }}>
          <TrendUpIcon size={14} />
          <span>
            {T.timeInRangeLabel}: {tirPct}%
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <StatTile icon={<FireIcon size={16} />} tone="warn" label={T.streakLabel} value={streak} />
        <StatTile icon={<StarIcon size={16} />} tone="primary" label={T.pointsLabel} value={points} />
      </div>
    </div>
  );
}
