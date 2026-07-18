// ---- Onboarding: profile + diagnosis + treatment ----
const { useState: useStateOnb } = React;

const STEPS = ["profile", "diagnosis", "treatment", "review"];

function OnboardingScreen({ initial, onComplete }) {
  const [step, setStep] = useStateOnb(0);
  const [data, setData] = useStateOnb({
    name: "", gender: "", age: "",
    diagnosisDate: "", diabetesType: "type1",
    treatmentMode: "insulin", // insulin | pills | both
    insulinDelivery: "injections", // injections | pump
    rapidType: window.RAPID_INSULINS[0], rapidUnits: "",
    basalType: window.BASAL_INSULINS[0], basalUnits: "",
    pills: [],
    units: "mgdl",
    ...initial,
  });
  const [manualOverride, setManualOverride] = useStateOnb(false);
  const [manualCarbRatio, setManualCarbRatio] = useStateOnb(initial && initial.carbRatioOverridden ? initial.carbRatio : "");
  const [manualISF, setManualISF] = useStateOnb(initial && initial.carbRatioOverridden ? initial.isf : "");

  function set(patch) { setData(d => ({ ...d, ...patch })); }
  function togglePill(p) {
    set({ pills: data.pills.includes(p) ? data.pills.filter(x => x !== p) : [...data.pills, p] });
  }

  const usesInsulin = data.treatmentMode === "insulin" || data.treatmentMode === "both";
  const usesPills = data.treatmentMode === "pills" || data.treatmentMode === "both";

  const tdd = usesInsulin ? (Number(data.rapidUnits) || 0) + (Number(data.basalUnits) || 0) : 0;
  const carbRatio = tdd > 0 ? window.calcCarbRatio(tdd) : null;
  const isf = tdd > 0 ? window.calcISF(Number(data.rapidUnits) || 0, Number(data.basalUnits) || 0) : null;

  function canNext() {
    if (step === 0) return data.name.trim() && data.gender && data.age;
    if (step === 1) return data.diagnosisDate && data.diabetesType;
    if (step === 2) {
      if (usesInsulin) {
        if (!data.basalUnits) return false;
        if (data.insulinDelivery !== "pump" && !data.rapidUnits) return false;
      }
      if (usesPills && data.pills.length === 0) return false;
      return true;
    }
    return true;
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onComplete({
      ...data,
      tdd,
      carbRatio: manualOverride && manualCarbRatio ? Number(manualCarbRatio) : carbRatio,
      isf: manualOverride && manualISF ? Number(manualISF) : isf,
      carbRatioOverridden: manualOverride,
    });
  }
  function back() {
    if (step === 0) return;
    setStep(step - 1);
  }

  return (
    <AppShell>
      <TopBar title="Set up your profile" onBack={step > 0 ? back : undefined} />
      <ProgressDots total={STEPS.length} current={step} />
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 20px", display: "flex", flexDirection: "column", gap: 18 }}>

        {step === 0 && (
          <>
            <Field label="Full name">
              <TextInput value={data.name} onChange={e => set({ name: e.target.value })} placeholder="Your name" />
            </Field>
            <Field label="Gender">
              <SegmentedControl value={data.gender} onChange={g => set({ gender: g })}
                options={[{ value: "female", label: "Female" }, { value: "male", label: "Male" }, { value: "other", label: "Other" }]} />
            </Field>
            <Field label="Age">
              <TextInput type="number" min="1" max="120" value={data.age} onChange={e => set({ age: e.target.value })} placeholder="e.g. 29" />
            </Field>
            <Field label="Preferred glucose units">
              <SegmentedControl value={data.units} onChange={u => set({ units: u })}
                options={[{ value: "mgdl", label: "mg/dL" }, { value: "mmol", label: "mmol/L" }]} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="When were you diagnosed?">
              <TextInput type="date" value={data.diagnosisDate} onChange={e => set({ diagnosisDate: e.target.value })} />
            </Field>
            <Field label="Type of diabetes">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {window.DIABETES_TYPES.map(t => (
                  <button key={t.id} onClick={() => set({ diabetesType: t.id })} style={{
                    padding: "10px 16px", borderRadius: 999, fontSize: 13.5, fontWeight: 700,
                    border: data.diabetesType === t.id ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                    background: data.diabetesType === t.id ? "var(--primary-tint)" : "var(--surface)",
                    color: data.diabetesType === t.id ? "var(--primary-dark)" : "var(--text)",
                  }}>{t.label}</button>
                ))}
              </div>
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="How do you manage your diabetes?">
              <SegmentedControl value={data.treatmentMode} onChange={m => set({ treatmentMode: m })}
                options={[{ value: "insulin", label: "Insulin" }, { value: "pills", label: "Pills" }, { value: "both", label: "Both" }]} />
            </Field>

            {usesInsulin && (
              <Card style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>Insulin regimen</div>
                <Field label="How is your insulin delivered?">
                  <SegmentedControl value={data.insulinDelivery} onChange={v => set({ insulinDelivery: v })}
                    options={[{ value: "injections", label: "Injections (MDI)" }, { value: "pump", label: "Insulin pump" }]} />
                </Field>

                {data.insulinDelivery === "pump" ? (
                  <>
                    <Field label="Insulin used in pump" hint="Pumps use rapid-acting insulin only">
                      <Select value={data.rapidType} onChange={v => set({ rapidType: v })} options={window.RAPID_INSULINS} />
                    </Field>
                    <Field label="Bolus (meal) units per day" hint="Optional — from your pump history, total meal/correction boluses in a typical day">
                      <TextInput type="number" min="0" value={data.rapidUnits} onChange={e => set({ rapidUnits: e.target.value })} placeholder="e.g. 40 (optional)" />
                    </Field>
                    <Field label="Basal (background) units per day" hint="Total basal delivered by the pump in a typical day">
                      <TextInput type="number" min="0" value={data.basalUnits} onChange={e => set({ basalUnits: e.target.value })} placeholder="e.g. 20" />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Rapid-acting (mealtime) insulin">
                      <Select value={data.rapidType} onChange={v => set({ rapidType: v })} options={window.RAPID_INSULINS} />
                    </Field>
                    <Field label="Total rapid units per day" hint="Sum of all mealtime doses across a typical day">
                      <TextInput type="number" min="0" value={data.rapidUnits} onChange={e => set({ rapidUnits: e.target.value })} placeholder="e.g. 60" />
                    </Field>
                    <Field label="Basal (long-acting) insulin">
                      <Select value={data.basalType} onChange={v => set({ basalType: v })} options={window.BASAL_INSULINS} />
                    </Field>
                    <Field label="Total basal units per day">
                      <TextInput type="number" min="0" value={data.basalUnits} onChange={e => set({ basalUnits: e.target.value })} placeholder="e.g. 35" />
                    </Field>
                  </>
                )}
              </Card>
            )}

            {usesPills && (
              <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>Oral medication(s)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {window.PILL_OPTIONS.map(p => (
                    <button key={p} onClick={() => togglePill(p)} style={{
                      padding: "9px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700,
                      border: data.pills.includes(p) ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                      background: data.pills.includes(p) ? "var(--primary-tint)" : "var(--surface)",
                      color: data.pills.includes(p) ? "var(--primary-dark)" : "var(--text)",
                    }}>{p}</button>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>
              Based on your total daily insulin dose, here are your calculated ratios
              (500 rule for carb ratio, 1500 rule for insulin sensitivity):
            </div>
            {usesInsulin ? (
              <>
                <div style={{ display: "flex", gap: 10 }}>
                  <StatTile label="Total daily dose" value={tdd} unit="u" tone="neutral" />
                  <StatTile label="Carb ratio" value={window.round2(manualOverride && manualCarbRatio ? Number(manualCarbRatio) : carbRatio)} unit="g/u" tone="primary" />
                  <StatTile label="Sensitivity (ISF)" value={window.round2(manualOverride && manualISF ? Number(manualISF) : isf)} unit="mg/dL/u" tone="neutral" />
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>
                  1 unit of rapid insulin covers about <b>{window.round2(manualOverride && manualCarbRatio ? Number(manualCarbRatio) : carbRatio)}g</b> of carbohydrate,
                  and lowers blood glucose by about <b>{window.round2(manualOverride && manualISF ? Number(manualISF) : isf)} mg/dL</b>.
                </div>
                <Card style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>My doctor gave me different numbers</div>
                    <button onClick={() => setManualOverride(v => !v)} style={{
                      border: "none", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 700,
                      background: manualOverride ? "var(--primary)" : "var(--surface-2)",
                      color: manualOverride ? "white" : "var(--text-2)",
                    }}>{manualOverride ? "On" : "Off"}</button>
                  </div>
                  {manualOverride && (
                    <div style={{ display: "flex", gap: 12 }}>
                      <Field label="Carb ratio (g per unit)">
                        <TextInput type="number" value={manualCarbRatio} onChange={e => setManualCarbRatio(e.target.value)} placeholder={window.round2(carbRatio)} />
                      </Field>
                      <Field label="ISF (mg/dL per unit)">
                        <TextInput type="number" value={manualISF} onChange={e => setManualISF(e.target.value)} placeholder={window.round2(isf)} />
                      </Field>
                    </div>
                  )}
                </Card>
              </>
            ) : (
              <div style={{ fontSize: 13.5, color: "var(--text-2)", background: "var(--surface-2)", borderRadius: 12, padding: 14 }}>
                Since you're managing with oral medication only, dose calculations are skipped —
                you can still log meals and glucose readings for your history.
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ padding: 20, borderTop: "1px solid var(--border)" }}>
        <Button full size="lg" disabled={!canNext()} onClick={next}>
          {step === STEPS.length - 1 ? "Finish setup" : "Continue"}
        </Button>
      </div>
    </AppShell>
  );
}

window.OnboardingScreen = OnboardingScreen;
