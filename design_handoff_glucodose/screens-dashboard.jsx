// ---- Dashboard: ring, quick log, carb calculator, history preview, premium banner ----
const { useState: useStateDash } = React;

function DashboardScreen({ profile, entries, customFoods, onAddCustomFood, onLog, isPremium, units, onGoTab }) {
  const [bgOpen, setBgOpen] = useStateDash(false);

  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const readings = entries.filter(e => e.timestamp >= cutoff && e.currentBG !== undefined);
  const inRangeCount = readings.filter(e => window.classifyBG(e.currentBG, units) === "inRange").length;
  const tirPct = readings.length ? Math.round((inRangeCount / readings.length) * 100) : 0;

  const lastBG = [...entries].reverse().find(e => e.currentBG !== undefined);
  const lastDose = [...entries].reverse().find(e => e.dose !== undefined);

  const recentEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 2);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

      <DashboardCard icon="📅" title="Log Your Day">
        <RingProgress pct={tirPct} label="Today's Time in Range" sublabel={readings.length ? (tirPct >= 70 ? "Green" : tirPct >= 40 ? "Fair" : "Needs attention") : "No data"} color={tirPct >= 70 ? "var(--good)" : tirPct >= 40 ? "var(--warn)" : "var(--danger)"} />
      </DashboardCard>

      <DashboardCard icon="🩸" title="Quick Log" right={
        <Button size="sm" variant="secondary" onClick={() => setBgOpen(true)}>+ Log BG</Button>
      }>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, textAlign: "center", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "14px 8px" }}>
            <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>{lastBG ? lastBG.currentBG : "—"}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, marginTop: 2 }}>Current BG</div>
          </div>
          <div style={{ flex: 1, textAlign: "center", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "14px 8px" }}>
            <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>{lastDose ? `${lastDose.dose}u` : "—"}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, marginTop: 2 }}>Insulin Taken</div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard icon="🍎" title="Carb Calculator">
        <CalculatorScreen
          profile={profile}
          customFoods={customFoods}
          onAddCustomFood={onAddCustomFood}
          onLog={onLog}
          isPremium={isPremium}
          onGoPremium={() => onGoTab("premium")}
        />
      </DashboardCard>

      <DashboardCard icon="📋" title="Your History" right={
        <button onClick={() => onGoTab("history")} style={{ border: "none", background: "none", color: "var(--primary)", fontSize: 12.5, fontWeight: 700 }}>View all</button>
      }>
        {recentEntries.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>Nothing logged yet.</div>
        ) : recentEntries.map((e, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: i < recentEntries.length - 1 ? 10 : 0, borderBottom: i < recentEntries.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--text-3)" }}>
              <span>{new Date(e.timestamp).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {e.currentBG !== undefined && <Badge tone={window.RANGE_TONE[window.classifyBG(e.currentBG, units)] || "neutral"}>BG {e.currentBG}</Badge>}
              {e.carbs !== undefined && <Badge tone="neutral">Carbs {e.carbs}g</Badge>}
              {e.dose !== undefined && <Badge tone="neutral">Insulin {e.dose}u</Badge>}
            </div>
          </div>
        ))}
      </DashboardCard>

      {!isPremium && (
        <DashboardCard icon="👑" title="Unlock Premium" style={{ background: "var(--surface-2)", border: "none" }}>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>Unlimited history, PDF reports, CGM sync.</div>
          <Button onClick={() => onGoTab("premium")}>Subscribe</Button>
        </DashboardCard>
      )}

      <window.LogBGModal open={bgOpen} onClose={() => setBgOpen(false)} units={units} onSave={onLog} />
    </div>
  );
}

window.DashboardScreen = DashboardScreen;
