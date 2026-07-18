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
