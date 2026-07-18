"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardCard, RingProgress, Button, Badge } from "@/components/ui";
import { CalculatorWidget } from "@/components/Calculator";
import { LogBGModal } from "@/components/History";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { useLang } from "@/context/LangContext";
import { classifyBG } from "@/lib/calc";
import { RANGE_TONE } from "@/lib/historyMeta";

export default function DashboardPage() {
  const { user } = useAuth();
  const { entries, logEntry } = useAppData();
  const router = useRouter();
  const { t } = useLang();
  const T = t.dashboard;
  const [bgOpen, setBgOpen] = useState(false);

  if (!user?.profile) return null;
  const profile = user.profile;
  const isPremium = user.subscription.isPremium;

  // eslint-disable-next-line react-hooks/purity -- millisecond-scale render-time drift is inconsequential for a 7-day filter cutoff
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const readings = entries.filter((e) => e.timestamp >= cutoff && e.currentBG !== undefined);
  const inRangeCount = readings.filter((e) => classifyBG(e.currentBG!, profile.units) === "inRange").length;
  const tirPct = readings.length ? Math.round((inRangeCount / readings.length) * 100) : 0;

  const lastBG = [...entries].reverse().find((e) => e.currentBG !== undefined);
  const lastDose = [...entries].reverse().find((e) => e.dose !== undefined);

  const recentEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 2);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <DashboardCard icon="📅" title={T.logYourDayTitle}>
        <RingProgress
          pct={tirPct}
          label={T.timeInRangeLabel}
          sublabel={readings.length ? (tirPct >= 70 ? T.green : tirPct >= 40 ? T.fair : T.needsAttention) : T.noData}
          color={tirPct >= 70 ? "var(--good)" : tirPct >= 40 ? "var(--warn)" : "var(--danger)"}
        />
      </DashboardCard>

      <DashboardCard
        icon="🩸"
        title={T.quickLogTitle}
        right={
          <Button size="sm" variant="secondary" onClick={() => setBgOpen(true)}>
            {T.logBGBtn}
          </Button>
        }
      >
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, textAlign: "center", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "14px 8px" }}>
            <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>
              {lastBG ? lastBG.currentBG : t.common.dash}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, marginTop: 2 }}>{T.currentBGLabel}</div>
          </div>
          <div style={{ flex: 1, textAlign: "center", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "14px 8px" }}>
            <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>
              {lastDose ? `${lastDose.dose}u` : t.common.dash}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, marginTop: 2 }}>{T.insulinTakenLabel}</div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard icon="🍎" title={T.carbCalculatorTitle}>
        <CalculatorWidget profile={profile} />
      </DashboardCard>

      <DashboardCard
        icon="📋"
        title={T.yourHistoryTitle}
        right={
          <button onClick={() => router.push("/history")} style={{ border: "none", background: "none", color: "var(--primary)", fontSize: 12.5, fontWeight: 700 }}>
            {T.viewAllBtn}
          </button>
        }
      >
        {recentEntries.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>{T.nothingLoggedYet}</div>
        ) : (
          recentEntries.map((e, i) => (
            <div
              key={e.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                paddingBottom: i < recentEntries.length - 1 ? 10 : 0,
                borderBottom: i < recentEntries.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-3)" }}>
                <span>{new Date(e.timestamp).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {e.currentBG !== undefined && (
                  <Badge tone={RANGE_TONE[classifyBG(e.currentBG, profile.units) ?? ""] ?? "neutral"}>{T.bgBadge(e.currentBG)}</Badge>
                )}
                {e.carbs !== undefined && <Badge tone="neutral">{T.carbsBadge(e.carbs)}</Badge>}
                {e.dose !== undefined && <Badge tone="neutral">{T.insulinBadge(e.dose)}</Badge>}
              </div>
            </div>
          ))
        )}
      </DashboardCard>

      {!isPremium && (
        <DashboardCard icon="👑" title={T.unlockPremiumTitle} style={{ background: "var(--surface-2)", border: "none" }}>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>{T.unlockPremiumDesc}</div>
          <Button onClick={() => router.push("/premium")}>{T.subscribeBtn}</Button>
        </DashboardCard>
      )}

      <LogBGModal open={bgOpen} onClose={() => setBgOpen(false)} units={profile.units} onSave={logEntry} />
    </div>
  );
}
