"use client";

import { useState } from "react";
import { Card, Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { useLang } from "@/context/LangContext";
import { computeStreak, computePoints } from "@/lib/gamification";
import { classifyBG } from "@/lib/calc";

export default function SharePage() {
  const { user } = useAuth();
  const { entries } = useAppData();
  const { t } = useLang();
  const T = t.share;
  const [copied, setCopied] = useState(false);

  if (!user?.profile) return null;
  const units = user.profile.units;

  const streak = computeStreak(entries);
  const points = computePoints(entries);

  // eslint-disable-next-line react-hooks/purity -- day-granularity cutoff, render-time drift is inconsequential
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const readings = entries.filter((e) => e.timestamp >= cutoff && e.currentBG !== undefined);
  const inRangeCount = readings.filter((e) => classifyBG(e.currentBG!, units) === "inRange").length;
  const tirPct = readings.length ? Math.round((inRangeCount / readings.length) * 100) : 0;

  const shareText = [T.streakLine(streak), T.pointsLine(points), T.timeInRangeLine(tirPct)].join("\n");

  async function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ text: shareText, title: "GlucoDose" });
        return;
      } catch {
        // user cancelled the native share sheet — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800 }}>{T.title}</div>
        <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>{T.subtitle}</div>
      </div>

      <Card style={{ display: "flex", flexDirection: "column", gap: 10, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{T.streakLine(streak)}</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{T.pointsLine(points)}</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{T.timeInRangeLine(tirPct)}</div>
      </Card>

      <Button full onClick={share}>
        {copied ? T.copiedMsg : T.shareBtn}
      </Button>
    </div>
  );
}
