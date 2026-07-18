"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardCard, RingProgress, Button, Badge } from "@/components/ui";
import { CalculatorWidget } from "@/components/Calculator";
import { LogBGModal } from "@/components/History";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { classifyBG } from "@/lib/calc";
import { RANGE_TONE } from "@/lib/historyMeta";

export default function DashboardPage() {
  const { user } = useAuth();
  const { entries, logEntry } = useAppData();
  const router = useRouter();
  const [bgOpen, setBgOpen] = useState(false);

  if (!user?.profile) return null;
  const profile = user.profile;
  const isPremium = user.subscription.isPremium;

  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const readings = entries.filter((e) => e.timestamp >= cutoff && e.currentBG !== undefined);
  const inRangeCount = readings.filter((e) => classifyBG(e.currentBG!, profile.units) === "inRange").length;
  const tirPct = readings.length ? Math.round((inRangeCount / readings.length) * 100) : 0;

  const lastBG = [...entries].reverse().find((e) => e.currentBG !== undefined);
  const lastDose = [...entries].reverse().find((e) => e.dose !== undefined);

  const recentEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 2);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <DashboardCard icon="📅" title="Log Your Day">
        <RingProgress
          pct={tirPct}
          label="Today's Time in Range"
          sublabel={readings.length ? (tirPct >= 70 ? "Green" : tirPct >= 40 ? "Fair" : "Needs attention") : "No data"}
          color={tirPct >= 70 ? "var(--good)" : tirPct >= 40 ? "var(--warn)" : "var(--danger)"}
        />
      </DashboardCard>

      <DashboardCard
        icon="🩸"
        title="Quick Log"
        right={
          <Button size="sm" variant="secondary" onClick={() => setBgOpen(true)}>
            + Log BG
          </Button>
        }
      >
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, textAlign: "center", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "14px 8px" }}>
            <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>
              {lastBG ? lastBG.currentBG : "—"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, marginTop: 2 }}>Current BG</div>
          </div>
          <div style={{ flex: 1, textAlign: "center", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "14px 8px" }}>
            <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>
              {lastDose ? `${lastDose.dose}u` : "—"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, marginTop: 2 }}>Insulin Taken</div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard icon="🍎" title="Carb Calculator">
        <CalculatorWidget profile={profile} />
      </DashboardCard>

      <DashboardCard
        icon="📋"
        title="Your History"
        right={
          <button onClick={() => router.push("/history")} style={{ border: "none", background: "none", color: "var(--primary)", fontSize: 12.5, fontWeight: 700 }}>
            View all
          </button>
        }
      >
        {recentEntries.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>Nothing logged yet.</div>
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
                {e.currentBG !== undefined && <Badge tone={RANGE_TONE[classifyBG(e.currentBG, profile.units) ?? ""] ?? "neutral"}>BG {e.currentBG}</Badge>}
                {e.carbs !== undefined && <Badge tone="neutral">Carbs {e.carbs}g</Badge>}
                {e.dose !== undefined && <Badge tone="neutral">Insulin {e.dose}u</Badge>}
              </div>
            </div>
          ))
        )}
      </DashboardCard>

      {!isPremium && (
        <DashboardCard icon="👑" title="Unlock Premium" style={{ background: "var(--surface-2)", border: "none" }}>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>Unlimited history, PDF reports, CGM sync.</div>
          <Button onClick={() => router.push("/premium")}>Subscribe</Button>
        </DashboardCard>
      )}

      <LogBGModal open={bgOpen} onClose={() => setBgOpen(false)} units={profile.units} onSave={logEntry} />
    </div>
  );
}
