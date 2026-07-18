// ---- History: meals, doses, BG readings ----
const { useState: useStateHist, useMemo: useMemoHist } = React;

function formatWhen(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return "Today · " + time;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " · " + time;
}

const TYPE_META = {
  meal: { label: "Meal dose", tone: "primary" },
  mealCorrection: { label: "Meal + correction", tone: "primary" },
  correction: { label: "Correction dose", tone: "neutral" },
  hypo: { label: "Low BG treated", tone: "danger" },
  bg: { label: "Glucose reading", tone: "neutral" },
};

function LogBGModal({ open, onClose, units, onSave }) {
  const [val, setVal] = useStateHist("");
  function save() {
    if (!val) return;
    const mgdl = units === "mmol" ? Number(val) * 18.0182 : Number(val);
    onSave({ type: "bg", timestamp: Date.now(), currentBG: window.convertBG(mgdl, units) });
    setVal(""); onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title="Log a glucose reading">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label={`Blood glucose (${units === "mmol" ? "mmol/L" : "mg/dL"})`}>
          <TextInput type="number" value={val} onChange={e => setVal(e.target.value)} autoFocus placeholder={units === "mmol" ? "6.5" : "115"} />
        </Field>
        <Button full onClick={save}>Save reading</Button>
      </div>
    </Modal>
  );
}

const RANGE_TONE = { low: "good", high: "danger", inRange: "primary" };
const RANGE_LABEL = { low: "Low", high: "High", inRange: "In range" };

function TrendChart({ entries, units }) {
  const [days, setDays] = useStateHist(7);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const readings = entries.filter(e => e.timestamp >= cutoff && e.currentBG !== undefined);
  const counts = { low: 0, inRange: 0, high: 0 };
  readings.forEach(e => {
    const c = window.classifyBG(e.currentBG, units);
    if (c) counts[c]++;
  });
  const total = readings.length;
  const pct = k => total ? Math.round((counts[k] / total) * 100) : 0;

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>Time in range</div>
        <SegmentedControl value={days} onChange={setDays} options={[{ value: 7, label: "7d" }, { value: 14, label: "14d" }, { value: 30, label: "30d" }]} />
      </div>
      {total === 0 ? (
        <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>No glucose readings logged in this period yet.</div>
      ) : (
        <>
          <div style={{ display: "flex", height: 12, borderRadius: 999, overflow: "hidden" }}>
            {["low", "inRange", "high"].map(k => pct(k) > 0 && (
              <div key={k} style={{ width: `${pct(k)}%`, background: `var(--${RANGE_TONE[k]})` }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {["low", "inRange", "high"].map(k => (
              <div key={k} style={{ textAlign: "center" }}>
                <div className="num" style={{ fontSize: 17, fontWeight: 700, color: `var(--${RANGE_TONE[k]})` }}>{pct(k)}%</div>
                <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>{RANGE_LABEL[k]}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function HistoryScreen({ entries, units, onAddBG, isPremium, onGoPremium }) {
  const [filter, setFilter] = useStateHist("all");
  const [bgOpen, setBgOpen] = useStateHist(false);

  const filtered = useMemoHist(() => {
    const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
    if (filter === "all") return sorted;
    if (filter === "meals") return sorted.filter(e => e.type === "meal" || e.type === "mealCorrection");
    if (filter === "doses") return sorted.filter(e => ["meal", "mealCorrection", "correction", "hypo"].includes(e.type));
    if (filter === "bg") return sorted.filter(e => e.type === "bg" || "currentBG" in e);
    return sorted;
  }, [entries, filter]);

  const visible = isPremium ? filtered : filtered.slice(0, 15);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <TrendChart entries={entries} units={units} />
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="secondary" full onClick={() => setBgOpen(true)}>+ Log BG reading</Button>
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        {[{ id: "all", label: "All" }, { id: "meals", label: "Meals" }, { id: "doses", label: "Doses" }, { id: "bg", label: "Glucose" }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            flexShrink: 0, padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700,
            border: filter === f.id ? "1.5px solid var(--primary)" : "1px solid var(--border)",
            background: filter === f.id ? "var(--primary-tint)" : "var(--surface)",
            color: filter === f.id ? "var(--primary-dark)" : "var(--text-2)",
          }}>{f.label}</button>
        ))}
      </div>

      {visible.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--text-3)", fontSize: 13.5, padding: "40px 10px" }}>
          Nothing logged yet. Doses and readings you log from the Calculator will show up here.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map((e, i) => {
          const meta = TYPE_META[e.type] || TYPE_META.bg;
          const range = e.currentBG !== undefined ? window.classifyBG(e.currentBG, units) : null;
          return (
            <Card key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{formatWhen(e.timestamp)}</span>
                </div>
                {e.foods && e.foods.length > 0 && (
                  <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>
                    {e.foods.map(f => `${f.name}×${f.qty}`).join(", ")}
                  </div>
                )}
                {e.currentBG !== undefined && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-2)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: range ? `var(--${RANGE_TONE[range]})` : "var(--text-3)", flexShrink: 0 }} />
                    BG {e.currentBG}{e.targetBG !== undefined ? ` → target ${e.targetBG}` : ""}
                  </div>
                )}
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
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            {filtered.length - 15} more entries hidden
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 12 }}>
            Free accounts see your last 15 entries. Go Premium for unlimited history and export.
          </div>
          <Button onClick={onGoPremium}>See Premium</Button>
        </Card>
      )}

      <LogBGModal open={bgOpen} onClose={() => setBgOpen(false)} units={units} onSave={onAddBG} />
    </div>
  );
}

window.HistoryScreen = HistoryScreen;
window.LogBGModal = LogBGModal;
window.RANGE_TONE = RANGE_TONE;
