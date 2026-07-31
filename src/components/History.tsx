"use client";

import { useEffect, useState } from "react";
import { Modal, Field, TextInput, TextArea, Button, Card, SegmentedControl } from "@/components/ui";
import { classifyBG, convertBG } from "@/lib/calc";
import { RANGE_TONE } from "@/lib/historyMeta";
import { useLang } from "@/context/LangContext";
import { toDatetimeLocalValue, fromDatetimeLocalValue } from "@/lib/dateTimeLocal";
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
  const [ts, setTs] = useState(() => Date.now());
  const [maxTs] = useState(() => toDatetimeLocalValue(Date.now()));
  async function save() {
    if (!val) return;
    const mgdl = units === "mmol" ? Number(val) * 18.0182 : Number(val);
    await onSave({ type: "bg", timestamp: ts, currentBG: convertBG(mgdl, units) });
    setVal("");
    setTs(Date.now());
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title={T.logGlucoseTitle}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label={T.bloodGlucoseLabel(units === "mmol" ? "mmol/L" : "mg/dL")}>
          <TextInput type="number" value={val} onChange={(e) => setVal(e.target.value)} autoFocus placeholder={units === "mmol" ? "6.5" : "115"} />
        </Field>
        <Field label={T.whenLabel}>
          <TextInput
            type="datetime-local"
            value={toDatetimeLocalValue(ts)}
            max={maxTs}
            onChange={(e) => setTs(fromDatetimeLocalValue(e.target.value))}
          />
        </Field>
        <Button full onClick={save}>
          {T.saveReadingBtn}
        </Button>
      </div>
    </Modal>
  );
}

export function EditEntryModal({
  open,
  onClose,
  entry,
  units,
  onSave,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  entry: LogEntry | null;
  units: "mgdl" | "mmol";
  onSave: (id: string, patch: Partial<Omit<LogEntry, "id" | "type">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { t } = useLang();
  const T = t.history;
  const TC = t.calculator;
  const [currentBG, setCurrentBG] = useState("");
  const [targetBG, setTargetBG] = useState("");
  const [carbs, setCarbs] = useState("");
  const [dose, setDose] = useState("");
  const [carbsNeeded, setCarbsNeeded] = useState("");
  const [notes, setNotes] = useState("");
  const [ts, setTs] = useState(() => Date.now());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [maxTs] = useState(() => toDatetimeLocalValue(Date.now()));

  // Syncs the edit form's local state to whichever entry was tapped — a
  // deliberate one-time sync on prop change (see AuthContext.tsx for why
  // this pattern is kept as-is rather than restructured).
  useEffect(() => {
    if (!entry) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setCurrentBG(entry.currentBG !== undefined ? String(entry.currentBG) : "");
    setTargetBG(entry.targetBG !== undefined ? String(entry.targetBG) : "");
    setCarbs(entry.carbs !== undefined ? String(entry.carbs) : "");
    setDose(entry.dose !== undefined ? String(entry.dose) : "");
    setCarbsNeeded(entry.carbsNeeded !== undefined ? String(entry.carbsNeeded) : "");
    setNotes(entry.notes ?? "");
    setTs(entry.timestamp);
    setConfirmingDelete(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [entry]);

  if (!entry) return null;
  const unitLabel = units === "mmol" ? "mmol/L" : "mg/dL";

  async function save() {
    setSaving(true);
    try {
      const patch: Partial<Omit<LogEntry, "id" | "type">> = { timestamp: ts, notes: notes.trim() || undefined };
      if (entry!.currentBG !== undefined || entry!.type === "bg") patch.currentBG = currentBG ? Number(currentBG) : undefined;
      if (entry!.targetBG !== undefined) patch.targetBG = targetBG ? Number(targetBG) : undefined;
      if (entry!.carbs !== undefined) patch.carbs = carbs ? Number(carbs) : undefined;
      if (entry!.dose !== undefined) patch.dose = dose ? Number(dose) : undefined;
      if (entry!.carbsNeeded !== undefined) patch.carbsNeeded = carbsNeeded ? Number(carbsNeeded) : undefined;
      await onSave(entry!.id, patch);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setSaving(true);
    try {
      await onDelete(entry!.id);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={T.editEntryTitle}>
      {confirmingDelete ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 14, color: "var(--text)" }}>{T.deleteConfirmMessage}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" full onClick={() => setConfirmingDelete(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" full onClick={confirmDelete} disabled={saving}>
              {T.deleteConfirmBtn}
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {(entry.currentBG !== undefined || entry.type === "bg") && (
            <Field label={TC.currentBGLabel(unitLabel)}>
              <TextInput type="number" value={currentBG} onChange={(e) => setCurrentBG(e.target.value)} />
            </Field>
          )}
          {entry.targetBG !== undefined && (
            <Field label={TC.targetBGLabel(unitLabel)}>
              <TextInput type="number" value={targetBG} onChange={(e) => setTargetBG(e.target.value)} />
            </Field>
          )}
          {entry.carbs !== undefined && (
            <Field label={TC.totalCarbsLabel}>
              <TextInput type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
            </Field>
          )}
          {entry.carbsNeeded !== undefined && (
            <Field label={TC.hypoCarbsLabel}>
              <TextInput type="number" value={carbsNeeded} onChange={(e) => setCarbsNeeded(e.target.value)} />
            </Field>
          )}
          {entry.dose !== undefined && (
            <Field label={T.doseLabel}>
              <TextInput type="number" value={dose} onChange={(e) => setDose(e.target.value)} />
            </Field>
          )}
          <Field label={T.whenLabel}>
            <TextInput
              type="datetime-local"
              value={toDatetimeLocalValue(ts)}
              max={maxTs}
              onChange={(e) => setTs(fromDatetimeLocalValue(e.target.value))}
            />
          </Field>
          <Field label={TC.notesLabel}>
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={TC.notesPlaceholder} />
          </Field>
          <Button full onClick={save} disabled={saving}>
            {T.saveChangesBtn}
          </Button>
          <Button variant="danger" full onClick={() => setConfirmingDelete(true)} disabled={saving}>
            {T.deleteEntryBtn}
          </Button>
        </div>
      )}
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
