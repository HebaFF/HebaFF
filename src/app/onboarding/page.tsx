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
import { useLang } from "@/context/LangContext";
import { RAPID_INSULINS, BASAL_INSULINS, PILL_OPTIONS, diabetesTypesFor } from "@/lib/constants";
import { calcCarbRatio, calcISF, round2 } from "@/lib/calc";
import { api, ApiError } from "@/lib/api";

const STEPS = ["profile", "diagnosis", "treatment", "review"] as const;

type Gender = "" | "female" | "male";
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
  const { user, loading, refresh, logout } = useAuth();
  const router = useRouter();
  const { lang, t } = useLang();
  const T = t.onboarding;
  const diabetesTypes = diabetesTypesFor(lang);

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
    if (step === 3 && usesInsulin && manualOverride) {
      return manualCarbRatio.trim() !== "" && manualISF.trim() !== "";
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
      router.replace("/home");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : T.saveError);
    } finally {
      setSubmitting(false);
    }
  }
  function back() {
    if (step === 0) return;
    setStep(step - 1);
  }

  async function cancel() {
    await logout();
    router.replace("/login");
  }

  if (loading || !user) return null;

  const displayCarbRatio = manualOverride && manualCarbRatio ? Number(manualCarbRatio) : carbRatio;
  const displayISF = manualOverride && manualISF ? Number(manualISF) : isf;

  return (
    <AppShell>
      <TopBar
        title={T.title}
        onBack={step > 0 ? back : undefined}
        backLabel={t.common.back}
        right={
          step === 0 ? (
            <button
              onClick={cancel}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--text-2)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                padding: "8px 4px",
              }}
            >
              {t.common.cancel}
            </button>
          ) : undefined
        }
      />
      <ProgressDots total={STEPS.length} current={step} />
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
        {step === 0 && (
          <>
            <Field label={T.fullNameLabel}>
              <TextInput value={data.name} onChange={(e) => set({ name: e.target.value })} placeholder={T.fullNamePlaceholder} />
            </Field>
            <Field label={T.genderLabel}>
              <SegmentedControl
                value={data.gender}
                onChange={(g) => set({ gender: g as Gender })}
                options={[
                  { value: "female", label: T.female },
                  { value: "male", label: T.male },
                ]}
              />
            </Field>
            <Field label={T.ageLabel}>
              <TextInput
                type="number"
                min="1"
                max="120"
                value={data.age}
                onChange={(e) => set({ age: e.target.value })}
                placeholder={T.agePlaceholder}
              />
            </Field>
            <Field label={T.unitsLabel}>
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
            <Field label={T.diagnosisDateLabel}>
              <TextInput type="date" value={data.diagnosisDate} onChange={(e) => set({ diagnosisDate: e.target.value })} />
            </Field>
            <Field label={T.diabetesTypeLabel}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {diabetesTypes.map((dt) => (
                  <button
                    key={dt.id}
                    onClick={() => set({ diabetesType: dt.id })}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 999,
                      fontSize: 13.5,
                      fontWeight: 700,
                      border: data.diabetesType === dt.id ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                      background: data.diabetesType === dt.id ? "var(--primary-tint)" : "var(--surface)",
                      color: data.diabetesType === dt.id ? "var(--primary-dark)" : "var(--text)",
                    }}
                  >
                    {dt.label}
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label={T.treatmentModeLabel}>
              <SegmentedControl
                value={data.treatmentMode}
                onChange={(m) => set({ treatmentMode: m as TreatmentMode })}
                options={[
                  { value: "insulin", label: T.insulin },
                  { value: "pills", label: T.pills },
                  { value: "both", label: T.both },
                ]}
              />
            </Field>

            {usesInsulin && (
              <Card style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>{T.insulinRegimenTitle}</div>
                <Field label={T.deliveryLabel}>
                  <SegmentedControl
                    value={data.insulinDelivery}
                    onChange={(v) => set({ insulinDelivery: v as Delivery })}
                    options={[
                      { value: "injections", label: T.injections },
                      { value: "pump", label: T.pump },
                    ]}
                  />
                </Field>

                {data.insulinDelivery === "pump" ? (
                  <>
                    <Field label={T.pumpInsulinLabel} hint={T.pumpInsulinHint}>
                      <Select value={data.rapidType} onChange={(v) => set({ rapidType: v })} options={[...RAPID_INSULINS]} />
                    </Field>
                    <Field label={T.bolusUnitsLabel} hint={T.bolusUnitsHint}>
                      <TextInput
                        type="number"
                        min="0"
                        value={data.rapidUnits}
                        onChange={(e) => set({ rapidUnits: e.target.value })}
                        placeholder={T.bolusPlaceholder}
                      />
                    </Field>
                    <Field label={T.basalBackgroundLabel} hint={T.basalBackgroundHint}>
                      <TextInput
                        type="number"
                        min="0"
                        value={data.basalUnits}
                        onChange={(e) => set({ basalUnits: e.target.value })}
                        placeholder={T.basalPumpPlaceholder}
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label={T.rapidInsulinLabel}>
                      <Select value={data.rapidType} onChange={(v) => set({ rapidType: v })} options={[...RAPID_INSULINS]} />
                    </Field>
                    <Field label={T.rapidUnitsLabel} hint={T.rapidUnitsHint}>
                      <TextInput
                        type="number"
                        min="0"
                        value={data.rapidUnits}
                        onChange={(e) => set({ rapidUnits: e.target.value })}
                        placeholder={T.rapidPlaceholder}
                      />
                    </Field>
                    <Field label={T.basalInsulinLabel}>
                      <Select value={data.basalType} onChange={(v) => set({ basalType: v })} options={[...BASAL_INSULINS]} />
                    </Field>
                    <Field label={T.basalUnitsLabel}>
                      <TextInput
                        type="number"
                        min="0"
                        value={data.basalUnits}
                        onChange={(e) => set({ basalUnits: e.target.value })}
                        placeholder={T.basalPlaceholder}
                      />
                    </Field>
                  </>
                )}
              </Card>
            )}

            {usesPills && (
              <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>{T.oralMedicationTitle}</div>
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
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>{T.reviewIntro}</div>
            {usesInsulin ? (
              <>
                <div style={{ display: "flex", gap: 10 }}>
                  <StatTile label={T.totalDailyDoseLabel} value={tdd} unit="u" tone="neutral" />
                  <StatTile label={T.carbRatioLabel} value={displayCarbRatio ? round2(displayCarbRatio) : t.common.dash} unit="g/u" tone="primary" />
                  <StatTile label={T.sensitivityLabel} value={displayISF ? round2(displayISF) : t.common.dash} unit="mg/dL/u" tone="neutral" />
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>
                  {T.reviewSummary(
                    displayCarbRatio ? String(round2(displayCarbRatio)) : t.common.dash,
                    displayISF ? String(round2(displayISF)) : t.common.dash,
                  )}
                </div>
                <Card style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)" }}>{T.doctorOverrideLabel}</div>
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
                      {manualOverride ? T.on : T.off}
                    </button>
                  </div>
                  {manualOverride && (
                    <>
                      <div style={{ display: "flex", gap: 12 }}>
                        <Field label={T.carbRatioManualLabel}>
                          <TextInput
                            type="number"
                            value={manualCarbRatio}
                            onChange={(e) => setManualCarbRatio(e.target.value)}
                            placeholder={carbRatio ? String(round2(carbRatio)) : ""}
                          />
                        </Field>
                        <Field label={T.isfManualLabel}>
                          <TextInput
                            type="number"
                            value={manualISF}
                            onChange={(e) => setManualISF(e.target.value)}
                            placeholder={isf ? String(round2(isf)) : ""}
                          />
                        </Field>
                      </div>
                      {(!manualCarbRatio.trim() || !manualISF.trim()) && (
                        <div style={{ fontSize: 12, color: "var(--danger)", fontWeight: 600 }}>{T.doctorOverrideRequired}</div>
                      )}
                    </>
                  )}
                </Card>
              </>
            ) : (
              <div style={{ fontSize: 13.5, color: "var(--text-2)", background: "var(--surface-2)", borderRadius: 12, padding: 14 }}>
                {T.pillsOnlyNotice}
              </div>
            )}
          </>
        )}

        {error && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{error}</div>}
      </div>

      <div style={{ padding: 20, borderTop: "1px solid var(--border)" }}>
        <Button full size="lg" disabled={!canNext() || submitting} onClick={next}>
          {submitting ? t.common.savingBtn : step === STEPS.length - 1 ? T.finishSetup : t.common.continueBtn}
        </Button>
      </div>
    </AppShell>
  );
}
