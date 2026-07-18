"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppShell,
  TopBar,
  ProgressDots,
  Field,
  TextInput,
  SegmentedControl,
  Select,
  Card,
  StatTile,
  Button,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { RAPID_INSULINS, BASAL_INSULINS, PILL_OPTIONS, DIABETES_TYPES } from "@/lib/constants";
import { calcCarbRatio, calcISF, round2 } from "@/lib/calc";
import { api, ApiError } from "@/lib/api";

const STEPS = ["profile", "diagnosis", "treatment", "review"] as const;

type Gender = "" | "female" | "male" | "other";
type TreatmentMode = "insulin" | "pills" | "both";
type Delivery = "injections" | "pump";

type FormData = {
  name: string;
  gender: Gender;
  age: string;
  diagnosisDate: string;
  diabetesType: string;
  treatmentMode: TreatmentMode;
  insulinDelivery: Delivery;
  rapidType: string;
  rapidUnits: string;
  basalType: string;
  basalUnits: string;
  pills: string[];
  units: "mgdl" | "mmol";
};

export default function OnboardingPage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const initial = user?.profile;

  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>({
    name: initial?.name ?? "",
    gender: (initial?.gender as Gender) ?? "",
    age: initial ? String(initial.age) : "",
    diagnosisDate: initial?.diagnosisDate ?? "",
    diabetesType: initial?.diabetesType ?? "type1",
    treatmentMode: (initial?.treatmentMode as TreatmentMode) ?? "insulin",
    insulinDelivery: (initial?.insulinDelivery as Delivery) ?? "injections",
    rapidType: initial?.rapidType ?? RAPID_INSULINS[0],
    rapidUnits: initial?.rapidUnits ? String(initial.rapidUnits) : "",
    basalType: initial?.basalType ?? BASAL_INSULINS[0],
    basalUnits: initial?.basalUnits ? String(initial.basalUnits) : "",
    pills: initial?.pills ?? [],
    units: initial?.units ?? "mgdl",
  });
  const [manualOverride, setManualOverride] = useState(!!initial?.carbRatioOverridden);
  const [manualCarbRatio, setManualCarbRatio] = useState(
    initial?.carbRatioOverridden && initial.carbRatio ? String(initial.carbRatio) : "",
  );
  const [manualISF, setManualISF] = useState(
    initial?.carbRatioOverridden && initial.isf ? String(initial.isf) : "",
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function set(patch: Partial<FormData>) {
    setData((d) => ({ ...d, ...patch }));
  }
  function togglePill(p: string) {
    set({ pills: data.pills.includes(p) ? data.pills.filter((x) => x !== p) : [...data.pills, p] });
  }

  const usesInsulin = data.treatmentMode === "insulin" || data.treatmentMode === "both";
  const usesPills = data.treatmentMode === "pills" || data.treatmentMode === "both";

  const rapidN = Number(data.rapidUnits) || 0;
  const basalN = Number(data.basalUnits) || 0;
  const tdd = usesInsulin ? rapidN + basalN : 0;
  const carbRatio = tdd > 0 ? calcCarbRatio(tdd) : null;
  const isf = tdd > 0 && rapidN > 0 ? calcISF(rapidN, basalN) : null;

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

  async function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.saveProfile({
        name: data.name,
        gender: data.gender,
        age: data.age,
        diagnosisDate: data.diagnosisDate,
        diabetesType: data.diabetesType,
        treatmentMode: data.treatmentMode,
        insulinDelivery: data.insulinDelivery,
        rapidType: data.rapidType,
        rapidUnits: data.rapidUnits || undefined,
        basalType: data.basalType,
        basalUnits: data.basalUnits || undefined,
        pills: data.pills,
        units: data.units,
        carbRatioOverridden: manualOverride,
        manualCarbRatio: manualCarbRatio || undefined,
        manualISF: manualISF || undefined,
      });
      await refresh();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your profile.");
    } finally {
      setSubmitting(false);
    }
  }
  function back() {
    if (step === 0) return;
    setStep(step - 1);
  }

  if (loading || !user) return null;

  const displayCarbRatio = manualOverride && manualCarbRatio ? Number(manualCarbRatio) : carbRatio;
  const displayISF = manualOverride && manualISF ? Number(manualISF) : isf;

  return (
    <AppShell>
      <TopBar title="Set up your profile" onBack={step > 0 ? back : undefined} />
      <ProgressDots total={STEPS.length} current={step} />
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
        {step === 0 && (
          <>
            <Field label="Full name">
              <TextInput value={data.name} onChange={(e) => set({ name: e.target.value })} placeholder="Your name" />
            </Field>
            <Field label="Gender">
              <SegmentedControl
                value={data.gender}
                onChange={(g) => set({ gender: g as Gender })}
                options={[
                  { value: "female", label: "Female" },
                  { value: "male", label: "Male" },
                  { value: "other", label: "Other" },
                ]}
              />
            </Field>
            <Field label="Age">
              <TextInput
                type="number"
                min="1"
                max="120"
                value={data.age}
                onChange={(e) => set({ age: e.target.value })}
                placeholder="e.g. 29"
              />
            </Field>
            <Field label="Preferred glucose units">
              <SegmentedControl
                value={data.units}
                onChange={(u) => set({ units: u as "mgdl" | "mmol" })}
                options={[
                  { value: "mgdl", label: "mg/dL" },
                  { value: "mmol", label: "mmol/L" },
                ]}
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="When were you diagnosed?">
              <TextInput type="date" value={data.diagnosisDate} onChange={(e) => set({ diagnosisDate: e.target.value })} />
            </Field>
            <Field label="Type of diabetes">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {DIABETES_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => set({ diabetesType: t.id })}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 999,
                      fontSize: 13.5,
                      fontWeight: 700,
                      border: data.diabetesType === t.id ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                      background: data.diabetesType === t.id ? "var(--primary-tint)" : "var(--surface)",
                      color: data.diabetesType === t.id ? "var(--primary-dark)" : "var(--text)",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="How do you manage your diabetes?">
              <SegmentedControl
                value={data.treatmentMode}
                onChange={(m) => set({ treatmentMode: m as TreatmentMode })}
                options={[
                  { value: "insulin", label: "Insulin" },
                  { value: "pills", label: "Pills" },
                  { value: "both", label: "Both" },
                ]}
              />
            </Field>

            {usesInsulin && (
              <Card style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>Insulin regimen</div>
                <Field label="How is your insulin delivered?">
                  <SegmentedControl
                    value={data.insulinDelivery}
                    onChange={(v) => set({ insulinDelivery: v as Delivery })}
                    options={[
                      { value: "injections", label: "Injections (MDI)" },
                      { value: "pump", label: "Insulin pump" },
                    ]}
                  />
                </Field>

                {data.insulinDelivery === "pump" ? (
                  <>
                    <Field label="Insulin used in pump" hint="Pumps use rapid-acting insulin only">
                      <Select value={data.rapidType} onChange={(v) => set({ rapidType: v })} options={[...RAPID_INSULINS]} />
                    </Field>
                    <Field
                      label="Bolus (meal) units per day"
                      hint="Optional — from your pump history, total meal/correction boluses in a typical day"
                    >
                      <TextInput
                        type="number"
                        min="0"
                        value={data.rapidUnits}
                        onChange={(e) => set({ rapidUnits: e.target.value })}
                        placeholder="e.g. 40 (optional)"
                      />
                    </Field>
                    <Field label="Basal (background) units per day" hint="Total basal delivered by the pump in a typical day">
                      <TextInput
                        type="number"
                        min="0"
                        value={data.basalUnits}
                        onChange={(e) => set({ basalUnits: e.target.value })}
                        placeholder="e.g. 20"
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Rapid-acting (mealtime) insulin">
                      <Select value={data.rapidType} onChange={(v) => set({ rapidType: v })} options={[...RAPID_INSULINS]} />
                    </Field>
                    <Field label="Total rapid units per day" hint="Sum of all mealtime doses across a typical day">
                      <TextInput
                        type="number"
                        min="0"
                        value={data.rapidUnits}
                        onChange={(e) => set({ rapidUnits: e.target.value })}
                        placeholder="e.g. 60"
                      />
                    </Field>
                    <Field label="Basal (long-acting) insulin">
                      <Select value={data.basalType} onChange={(v) => set({ basalType: v })} options={[...BASAL_INSULINS]} />
                    </Field>
                    <Field label="Total basal units per day">
                      <TextInput
                        type="number"
                        min="0"
                        value={data.basalUnits}
                        onChange={(e) => set({ basalUnits: e.target.value })}
                        placeholder="e.g. 35"
                      />
                    </Field>
                  </>
                )}
              </Card>
            )}

            {usesPills && (
              <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>Oral medication(s)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {PILL_OPTIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => togglePill(p)}
                      style={{
                        padding: "9px 14px",
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 700,
                        border: data.pills.includes(p) ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                        background: data.pills.includes(p) ? "var(--primary-tint)" : "var(--surface)",
                        color: data.pills.includes(p) ? "var(--primary-dark)" : "var(--text)",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>
              Based on your total daily insulin dose, here are your calculated ratios (500 rule for carb ratio,
              1500 rule for insulin sensitivity):
            </div>
            {usesInsulin ? (
              <>
                <div style={{ display: "flex", gap: 10 }}>
                  <StatTile label="Total daily dose" value={tdd} unit="u" tone="neutral" />
                  <StatTile label="Carb ratio" value={displayCarbRatio ? round2(displayCarbRatio) : "—"} unit="g/u" tone="primary" />
                  <StatTile label="Sensitivity (ISF)" value={displayISF ? round2(displayISF) : "—"} unit="mg/dL/u" tone="neutral" />
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>
                  1 unit of rapid insulin covers about <b>{displayCarbRatio ? round2(displayCarbRatio) : "—"}g</b> of
                  carbohydrate, and lowers blood glucose by about <b>{displayISF ? round2(displayISF) : "—"} mg/dL</b>.
                </div>
                <Card style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>
                      My doctor gave me different numbers
                    </div>
                    <button
                      onClick={() => setManualOverride((v) => !v)}
                      style={{
                        border: "none",
                        borderRadius: 999,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        background: manualOverride ? "var(--primary)" : "var(--surface-2)",
                        color: manualOverride ? "white" : "var(--text-2)",
                      }}
                    >
                      {manualOverride ? "On" : "Off"}
                    </button>
                  </div>
                  {manualOverride && (
                    <div style={{ display: "flex", gap: 12 }}>
                      <Field label="Carb ratio (g per unit)">
                        <TextInput
                          type="number"
                          value={manualCarbRatio}
                          onChange={(e) => setManualCarbRatio(e.target.value)}
                          placeholder={carbRatio ? String(round2(carbRatio)) : ""}
                        />
                      </Field>
                      <Field label="ISF (mg/dL per unit)">
                        <TextInput
                          type="number"
                          value={manualISF}
                          onChange={(e) => setManualISF(e.target.value)}
                          placeholder={isf ? String(round2(isf)) : ""}
                        />
                      </Field>
                    </div>
                  )}
                </Card>
              </>
            ) : (
              <div style={{ fontSize: 13.5, color: "var(--text-2)", background: "var(--surface-2)", borderRadius: 12, padding: 14 }}>
                Since you&apos;re managing with oral medication only, dose calculations are skipped — you can still
                log meals and glucose readings for your history.
              </div>
            )}
          </>
        )}

        {error && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{error}</div>}
      </div>

      <div style={{ padding: 20, borderTop: "1px solid var(--border)" }}>
        <Button full size="lg" disabled={!canNext() || submitting} onClick={next}>
          {submitting ? "Saving…" : step === STEPS.length - 1 ? "Finish setup" : "Continue"}
        </Button>
      </div>
    </AppShell>
  );
}
