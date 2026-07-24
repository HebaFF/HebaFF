"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge } from "@/components/ui";
import { DownloadIcon } from "@/components/icons";
import { TrendChart, LogBGModal } from "@/components/History";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { useLang } from "@/context/LangContext";
import { classifyBG } from "@/lib/calc";
import { RANGE_TONE, TYPE_TONE } from "@/lib/historyMeta";
import { buildReportPdf } from "@/lib/report";

function formatWhen(ts: number, todayLabel: string, locale: string) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `${todayLabel} · ${time}`;
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" }) + " · " + time;
}

type Filter = "all" | "meals" | "doses" | "bg";

export default function HistoryPage() {
  const { user } = useAuth();
  const { entries, logEntry } = useAppData();
  const router = useRouter();
  const { lang, t } = useLang();
  const T = t.history;
  const locale = lang === "ar" ? "ar" : "en";
  const [filter, setFilter] = useState<Filter>("all");
  const [bgOpen, setBgOpen] = useState(false);

  const profile = user?.profile;
  const isPremium = !!user?.subscription.isPremium;

  const typeLabel: Record<string, string> = {
    meal: T.mealDoseType,
    mealCorrection: T.mealCorrType,
    correction: T.correctionType,
    hypo: T.hypoType,
    bg: T.bgType,
  };

  const filtered = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    if (filter === "all") return sorted;
    if (filter === "meals") return sorted.filter((e) => e.type === "meal" || e.type === "mealCorrection");
    if (filter === "doses") return sorted.filter((e) => ["meal", "mealCorrection", "correction", "hypo"].includes(e.type));
    if (filter === "bg") return sorted.filter((e) => e.type === "bg" || e.currentBG !== undefined);
    return sorted;
  }, [entries, filter]);

  if (!profile) return null;
  const visible = isPremium ? filtered : filtered.slice(0, 15);

  function downloadReport() {
    const doc = buildReportPdf({ patientName: user?.profile?.name ?? "", units: profile!.units, entries });
    doc.save(`GlucoDose-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div style={{ padding: "6px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <TrendChart entries={entries} units={profile.units} />
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="secondary" full onClick={() => setBgOpen(true)}>
          {T.logBGReadingBtn}
        </Button>
        <Button variant="outline" full onClick={downloadReport}>
          <DownloadIcon size={16} />
          {T.downloadReportBtn}
        </Button>
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        {(
          [
            { id: "all", label: T.filterAll },
            { id: "meals", label: T.filterMeals },
            { id: "doses", label: T.filterDoses },
            { id: "bg", label: T.filterGlucose },
          ] as { id: Filter; label: string }[]
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              flexShrink: 0,
              padding: "7px 14px",
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 700,
              border: filter === f.id ? "1.5px solid var(--primary)" : "1px solid var(--border)",
              background: filter === f.id ? "var(--primary-tint)" : "var(--surface)",
              color: filter === f.id ? "var(--primary-dark)" : "var(--text-2)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--text-3)", fontSize: 13.5, padding: "40px 10px" }}>{T.nothingLoggedMessage}</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map((e) => {
          const tone = TYPE_TONE[e.type] || TYPE_TONE.bg;
          const label = typeLabel[e.type] || typeLabel.bg;
          const range = e.currentBG !== undefined ? classifyBG(e.currentBG, profile.units) : null;
          return (
            <Card key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <Badge tone={tone}>{label}</Badge>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{formatWhen(e.timestamp, T.today, locale)}</span>
                </div>
                {e.foods && e.foods.length > 0 && (
                  <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{e.foods.map((f) => `${f.name}×${f.qty}`).join(", ")}</div>
                )}
                {e.currentBG !== undefined && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-2)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: range ? `var(--${RANGE_TONE[range]})` : "var(--text-3)", flexShrink: 0 }} />
                    {T.bgReading(e.currentBG)}
                    {e.targetBG !== undefined ? T.targetArrow(e.targetBG) : ""}
                  </div>
                )}
                {e.notes && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4, fontStyle: "italic" }}>“{e.notes}”</div>}
              </div>
              <div className="num" style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", whiteSpace: "nowrap" }}>
                {e.dose !== undefined ? `${e.dose}u` : e.carbsNeeded !== undefined ? `${e.carbsNeeded}g` : e.carbs !== undefined ? `${e.carbs}g` : `${e.currentBG}`}
              </div>
            </Card>
          );
        })}
      </div>

      {!isPremium && filtered.length > 15 && (
        <Card style={{ background: "var(--surface-2)", border: "none", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{T.hiddenEntries(filtered.length - 15)}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 12 }}>{T.freeAccountsMessage}</div>
          <Button onClick={() => router.push("/premium")}>{T.seePremiumBtn}</Button>
        </Card>
      )}

      <LogBGModal open={bgOpen} onClose={() => setBgOpen(false)} units={profile.units} onSave={logEntry} />
    </div>
  );
}
