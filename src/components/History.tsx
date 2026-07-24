"use client";

import { useState } from "react";
import { Modal, Field, TextInput, Button, Card, SegmentedControl } from "@/components/ui";
import { classifyBG, convertBG } from "@/lib/calc";
import { RANGE_TONE } from "@/lib/historyMeta";
import { useLang } from "@/context/LangContext";
import type { LogEntry } from "@/lib/api";

export function LogBGModal({
  open,
  onClose,
  units,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  units: "mgdl" | "mmol";
  onSave: (entry: Omit<LogEntry, "id">) => Promise<void>;
}) {
  const { t } = useLang();
  const T = t.history;
  const [val, setVal] = useState("");
  async function save() {
    if (!val) return;
    const mgdl = units === "mmol" ? Number(val) * 18.0182 : Number(val);
    await onSave({ type: "bg", timestamp: Date.now(), currentBG: convertBG(mgdl, units) });
    setVal("");
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title={T.logGlucoseTitle}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label={T.bloodGlucoseLabel(units === "mmol" ? "mmol/L" : "mg/dL")}>
          <TextInput type="number" value={val} onChange={(e) => setVal(e.target.value)} autoFocus placeholder={units === "mmol" ? "6.5" : "115"} />
        </Field>
        <Button full onClick={save}>
          {T.saveReadingBtn}
        </Button>
      </div>
    </Modal>
  );
}

const DAY_TICKS = [0, 4 / 24, 8 / 24, 12 / 24, 16 / 24, 20 / 24];
const DAY_TICK_LABELS = ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM"];

export function GlucoseTrend24h({ entries, units }: { entries: LogEntry[]; units: "mgdl" | "mmol" }) {
  const { t } = useLang();
  const T = t.dashboard;
  // eslint-disable-next-line react-hooks/purity -- day-boundary + "now" cutoffs, render-time drift is inconsequential
  const now = Date.now();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayStartMs = dayStart.getTime();

  const readings = entries
    .filter((e) => e.timestamp >= dayStartMs && e.currentBG !== undefined)
    .sort((a, b) => a.timestamp - b.timestamp);

  const lowTarget = units === "mmol" ? convertBG(70, "mmol") : 70;
  const highTarget = units === "mmol" ? convertBG(180, "mmol") : 180;
  const domainMin = units === "mmol" ? convertBG(40, "mmol") : 40;
  const domainMax = units === "mmol" ? convertBG(260, "mmol") : 260;
  const midGrid = units === "mmol" ? convertBG(140, "mmol") : 140;

  const W = 320;
  const H = 150;
  const padL = 30;
  const padR = 6;
  const padT = 8;
  const padB = 20;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xFor = (ts: number) => padL + Math.min(1, Math.max(0, (ts - dayStartMs) / (24 * 3600000))) * plotW;
  const yFor = (v: number) => {
    const clamped = Math.min(domainMax, Math.max(domainMin, v));
    return padT + (1 - (clamped - domainMin) / (domainMax - domainMin)) * plotH;
  };

  const points = readings.map((e) => ({ x: xFor(e.timestamp), y: yFor(e.currentBG!) }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)} Z`
    : "";
  const last = readings[readings.length - 1];

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{T.trendTitle}</div>
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>{T.targetRangeLabel(lowTarget, highTarget)}</div>
      </div>
      {points.length < 2 ? (
        <div style={{ fontSize: 12.5, color: "var(--text-3)", padding: "24px 0", textAlign: "center" }}>{T.notEnoughDataChart}</div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
          <rect
            x={padL}
            y={yFor(highTarget)}
            width={plotW}
            height={Math.max(0, yFor(lowTarget) - yFor(highTarget))}
            fill="var(--primary-tint)"
            opacity={0.5}
            rx={4}
          />
          {[domainMax, midGrid, domainMin].map((v) => (
            <g key={v}>
              <line x1={padL} x2={padL + plotW} y1={yFor(v)} y2={yFor(v)} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
              <text x={padL - 6} y={yFor(v) + 3} textAnchor="end" fontSize={9} fill="var(--text-3)">
                {v}
              </text>
            </g>
          ))}
          <path d={areaPath} fill="var(--primary)" opacity={0.12} />
          <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {last && <circle cx={xFor(last.timestamp)} cy={yFor(last.currentBG!)} r={4} fill="var(--primary)" stroke="white" strokeWidth={2} />}
          {DAY_TICKS.map((frac, i) => (
            <text
              key={frac}
              x={padL + frac * plotW}
              y={H - 4}
              textAnchor={i === 0 ? "start" : "middle"}
              fontSize={9}
              fill="var(--text-3)"
            >
              {DAY_TICK_LABELS[i]}
            </text>
          ))}
        </svg>
      )}
    </Card>
  );
}

export function TrendChart({ entries, units }: { entries: LogEntry[]; units: "mgdl" | "mmol" }) {
  const { t } = useLang();
  const T = t.history;
  const [days, setDays] = useState(7);
  // eslint-disable-next-line react-hooks/purity -- day-granularity filter cutoff, render-time drift is inconsequential
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const readings = entries.filter((e) => e.timestamp >= cutoff && e.currentBG !== undefined);
  const counts: Record<string, number> = { low: 0, inRange: 0, high: 0 };
  readings.forEach((e) => {
    const c = classifyBG(e.currentBG!, units);
    if (c) counts[c]++;
  });
  const total = readings.length;
  const pct = (k: string) => (total ? Math.round((counts[k] / total) * 100) : 0);
  const rangeLabel: Record<string, string> = { low: T.low, inRange: T.inRange, high: T.high };

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>{T.timeInRangeTitle}</div>
        <SegmentedControl
          value={days}
          onChange={setDays}
          options={[
            { value: 7, label: "7d" },
            { value: 14, label: "14d" },
            { value: 30, label: "30d" },
          ]}
        />
      </div>
      {total === 0 ? (
        <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{T.noReadingsPeriod}</div>
      ) : (
        <>
          <div style={{ display: "flex", height: 12, borderRadius: 999, overflow: "hidden" }}>
            {["low", "inRange", "high"].map(
              (k) => pct(k) > 0 && <div key={k} style={{ width: `${pct(k)}%`, background: `var(--${RANGE_TONE[k]})` }} />,
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {["low", "inRange", "high"].map((k) => (
              <div key={k} style={{ textAlign: "center" }}>
                <div className="num" style={{ fontSize: 17, fontWeight: 700, color: `var(--${RANGE_TONE[k]})` }}>
                  {pct(k)}%
                </div>
                <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>{rangeLabel[k]}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
