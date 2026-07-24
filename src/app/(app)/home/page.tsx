"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, StatTile, Button, Badge } from "@/components/ui";
import { DropIcon, SyringeIcon, UtensilsIcon, DownloadIcon, TrendUpIcon, PlusIcon } from "@/components/icons";
import { LogBGModal } from "@/components/History";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { useLang } from "@/context/LangContext";
import { classifyBG } from "@/lib/calc";
import { RANGE_TONE, TYPE_TONE } from "@/lib/historyMeta";
import { computeActiveInsulin, computeActiveCarbs } from "@/lib/iob";
import { formatRelativeTime } from "@/lib/relativeTime";
import { buildReportPdf } from "@/lib/report";

export default function HomePage() {
  const { user } = useAuth();
  const { entries, logEntry } = useAppData();
  const router = useRouter();
  const { t } = useLang();
  const T = t.dashboard;
  const [bgOpen, setBgOpen] = useState(false);

  // eslint-disable-next-line react-hooks/purity -- minute-granularity "last logged"/IOB decay display, render-time drift is inconsequential
  const now = Date.now();

  if (!user?.profile) return null;
  const profile = user.profile;

  const bgReadings = [...entries].filter((e) => e.currentBG !== undefined).sort((a, b) => b.timestamp - a.timestamp);
  const lastBG = bgReadings[0];
  const prevBG = bgReadings[1];
  const range = lastBG ? classifyBG(lastBG.currentBG!, profile.units) : null;
  const trend = !lastBG || !prevBG ? null : lastBG.currentBG! > prevBG.currentBG! + 10 ? "rising" : lastBG.currentBG! < prevBG.currentBG! - 10 ? "falling" : "stable";
  const trendLabel = trend === "rising" ? T.risingLabel : trend === "falling" ? T.fallingLabel : T.stableLabel;

  const activeInsulin = computeActiveInsulin(entries, now);
  const activeCarbs = computeActiveCarbs(entries, now);

  const recentEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 2);

  function downloadReport() {
    const doc = buildReportPdf({ patientName: profile.name, units: profile.units, entries });
    doc.save(`GlucoDose-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {T.currentGlucoseLabel}
          </span>
          {range && (
            <Badge tone={RANGE_TONE[range] ?? "neutral"}>{range === "inRange" ? t.history.inRange : range === "low" ? t.history.low : t.history.high}</Badge>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
          <span className="num" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>
            {lastBG ? lastBG.currentBG : t.common.dash}
          </span>
          <span style={{ fontSize: 15, color: "var(--text-3)", fontWeight: 600 }}>{profile.units === "mmol" ? "mmol/L" : "mg/dL"}</span>
        </div>
        {trend && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 700, color: "var(--good)" }}>
            <TrendUpIcon size={13} style={{ transform: trend === "falling" ? "rotate(90deg) scaleX(-1)" : trend === "stable" ? "rotate(45deg)" : "none" }} />
            {trendLabel}
          </div>
        )}
        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
          {lastBG ? T.lastLogged(formatRelativeTime(lastBG.timestamp, now, t.community)) : T.noReadingsYet}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <Button full onClick={() => setBgOpen(true)}>
            {T.logGlucoseBtn}
          </Button>
          <Button full variant="outline" onClick={() => router.push("/calculator")}>
            {T.logMealDoseBtn}
          </Button>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 12 }}>
        <StatTile icon={<PlusIcon size={16} />} tone="sky" tinted label={T.activeInsulinLabel} value={activeInsulin} unit={T.unitsShort} />
        <StatTile icon={<UtensilsIcon size={16} />} tone="warn" tinted label={T.carbsOnBoardLabel} value={activeCarbs} unit={T.gramsUnitLabel} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{T.recentActivityTitle}</span>
          <button onClick={() => router.push("/history")} style={{ border: "none", background: "none", color: "var(--primary)", fontSize: 12.5, fontWeight: 700 }}>
            {T.viewAllArrow}
          </button>
        </div>

        {recentEntries.length === 0 ? (
          <Card style={{ fontSize: 13, color: "var(--text-3)" }}>{T.nothingLoggedYet}</Card>
        ) : (
          recentEntries.map((e) => {
            const isDoseOnly = e.dose !== undefined && e.currentBG === undefined;
            const entryRange = e.currentBG !== undefined ? classifyBG(e.currentBG, profile.units) : null;
            const chipTone = isDoseOnly ? "indigo" : entryRange === "low" || entryRange === "high" ? "danger" : "good";
            return (
              <Card key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: `var(--${chipTone}-tint)`,
                    color: `var(--${chipTone})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {isDoseOnly ? <SyringeIcon size={16} /> : <DropIcon size={16} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {isDoseOnly ? `${e.dose}U ${T.rapidInsulinLabel}` : `${e.currentBG} ${profile.units === "mmol" ? "mmol/L" : "mg/dL"} ${T.glucoseLabel}`}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                    {new Date(e.timestamp).toLocaleString([], { hour: "numeric", minute: "2-digit" })} · {isDoseOnly ? T.bolusDoseLabel : T.fingerstickLabel}
                  </div>
                </div>
                {e.carbs !== undefined && <Badge tone={TYPE_TONE[e.type] ?? "neutral"}>{T.carbsBadge(e.carbs)}</Badge>}
                {e.currentBG !== undefined && entryRange && (
                  <Badge tone={RANGE_TONE[entryRange] ?? "neutral"}>{entryRange === "inRange" ? T.normalBadge : entryRange === "low" ? t.history.low : t.history.high}</Badge>
                )}
              </Card>
            );
          })
        )}
      </div>

      <button
        onClick={downloadReport}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          border: "none",
          background: "var(--warn-tint)",
          borderRadius: "var(--radius-sm)",
          padding: "14px 16px",
          textAlign: "start",
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: "var(--surface)",
            color: "var(--warn)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <DownloadIcon size={18} />
        </span>
        <span style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--warn)" }}>{T.exportReportTitle}</div>
          <div style={{ fontSize: 12, color: "var(--text-2)" }}>{T.exportReportDesc}</div>
        </span>
      </button>

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
