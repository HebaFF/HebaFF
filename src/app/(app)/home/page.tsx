"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DashboardCard, StatTile, Button, Badge, FAB } from "@/components/ui";
import { DropIcon, SyringeIcon, ClipboardIcon, CrownIcon, ShareIcon } from "@/components/icons";
import { LogBGModal } from "@/components/History";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { useLang } from "@/context/LangContext";
import { classifyBG } from "@/lib/calc";
import { RANGE_TONE } from "@/lib/historyMeta";

export default function HomePage() {
  const { user } = useAuth();
  const { entries, logEntry } = useAppData();
  const router = useRouter();
  const { t } = useLang();
  const T = t.dashboard;
  const [bgOpen, setBgOpen] = useState(false);

  if (!user?.profile) return null;
  const profile = user.profile;
  const isPremium = user.subscription.isPremium;

  const lastBG = [...entries].reverse().find((e) => e.currentBG !== undefined);
  const lastDose = [...entries].reverse().find((e) => e.dose !== undefined);
  const recentEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 2);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
      <DashboardCard
        icon={<DropIcon />}
        title={T.quickLogTitle}
        tone="primary"
        right={
          <Button size="sm" variant="secondary" onClick={() => setBgOpen(true)}>
            {T.logBGBtn}
          </Button>
        }
      >
        <div style={{ display: "flex", gap: 12 }}>
          <StatTile icon={<DropIcon size={16} />} tone="neutral" label={T.currentBGLabel} value={lastBG ? lastBG.currentBG : t.common.dash} />
          <StatTile icon={<SyringeIcon size={16} />} tone="neutral" label={T.insulinTakenLabel} value={lastDose ? `${lastDose.dose}u` : t.common.dash} />
        </div>
      </DashboardCard>

      <DashboardCard
        icon={<ClipboardIcon />}
        title={T.yourHistoryTitle}
        tone="neutral"
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

      <button
        onClick={() => router.push("/share")}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          borderRadius: "var(--radius-sm)",
          padding: "12px 16px",
          fontSize: 13.5,
          fontWeight: 700,
          color: "var(--primary-dark)",
        }}
      >
        <ShareIcon size={17} />
        {t.share.title}
      </button>

      {!isPremium && (
        <DashboardCard icon={<CrownIcon />} title={T.unlockPremiumTitle} tone="surface" style={{ background: "var(--warn-tint)", border: "none" }}>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>{T.unlockPremiumDesc}</div>
          <Button onClick={() => router.push("/premium")}>{T.subscribeBtn}</Button>
        </DashboardCard>
      )}

      <FAB label={T.calculatorTab} onClick={() => router.push("/calculator")} />

      <LogBGModal
        open={bgOpen}
        onClose={() => setBgOpen(false)}
        units={profile.units}
        onSave={async (entry) => {
          await logEntry(entry);
          router.push("/history");
        }}
      />
    </div>
  );
}
