"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardCard, RingProgress, StatTile, Button, Badge, SegmentedControl, FAB } from "@/components/ui";
import { DropIcon, SyringeIcon, ClipboardIcon, CrownIcon, FireIcon, StarIcon, TrendUpIcon } from "@/components/icons";
import { CalculatorWidget } from "@/components/Calculator";
import { LogBGModal } from "@/components/History";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { useLang } from "@/context/LangContext";
import { classifyBG } from "@/lib/calc";
import { RANGE_TONE } from "@/lib/historyMeta";
import { computeStreak, computePoints } from "@/lib/gamification";

export default function DashboardPage() {
  const { user } = useAuth();
  const { entries, logEntry } = useAppData();
  const router = useRouter();
  const { t } = useLang();
  const T = t.dashboard;
  const [bgOpen, setBgOpen] = useState(false);
  const [tab, setTab] = useState<"overview" | "calculator">("overview");

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
  const streak = computeStreak(entries);
  const points = computePoints(entries);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: "overview", label: T.overviewTab },
          { value: "calculator", label: T.calculatorTab },
        ]}
      />

      {tab === "overview" && (
        <>
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

          <DashboardCard
            icon={<DropIcon />}
            title={T.quickLogTitle}
            tone="pink"
            right={
              <Button size="sm" variant="secondary" onClick={() => setBgOpen(true)}>
                {T.logBGBtn}
              </Button>
            }
          >
            <div style={{ display: "flex", gap: 12 }}>
              <StatTile icon={<DropIcon size={16} />} tone="pink" label={T.currentBGLabel} value={lastBG ? lastBG.currentBG : t.common.dash} />
              <StatTile icon={<SyringeIcon size={16} />} tone="neutral" label={T.insulinTakenLabel} value={lastDose ? `${lastDose.dose}u` : t.common.dash} />
            </div>
          </DashboardCard>

          <DashboardCard
            icon={<ClipboardIcon />}
            title={T.yourHistoryTitle}
            tone="teal"
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
            <DashboardCard icon={<CrownIcon />} title={T.unlockPremiumTitle} tone="surface" style={{ background: "var(--warn-tint)", border: "none" }}>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>{T.unlockPremiumDesc}</div>
              <Button onClick={() => router.push("/premium")}>{T.subscribeBtn}</Button>
            </DashboardCard>
          )}
        </>
      )}

      {tab === "calculator" && <CalculatorWidget profile={profile} />}

      {tab === "overview" && <FAB label={T.calculatorTab} onClick={() => setTab("calculator")} />}

      <LogBGModal open={bgOpen} onClose={() => setBgOpen(false)} units={profile.units} onSave={logEntry} />
    </div>
  );
}
