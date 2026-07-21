"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardCard, Badge, Button, Modal, Field, TextInput } from "@/components/ui";
import { ClipboardIcon, CalculatorIcon, CrownIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { diabetesTypesFor } from "@/lib/constants";
import { round2 } from "@/lib/calc";
import { api, ApiError } from "@/lib/api";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--text-2)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function RatioCard({
  label,
  value,
  unit,
  tone,
  recalculateLabel,
  onRecalculate,
}: {
  label: string;
  value: React.ReactNode;
  unit: string;
  tone: "primary" | "neutral";
  recalculateLabel: string;
  onRecalculate: () => void;
}) {
  const colorVar = tone === "neutral" ? "var(--text)" : `var(--${tone})`;
  return (
    <div
      style={{
        flex: 1,
        background: "var(--surface-2)",
        borderRadius: "var(--radius-sm)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>{label}</div>
      <div className="num" style={{ fontSize: 20, fontWeight: 700, color: colorVar }}>
        {value}
        <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 2 }}>{unit}</span>
      </div>
      <Button size="sm" variant="secondary" onClick={onRecalculate}>
        {recalculateLabel}
      </Button>
    </div>
  );
}

function EmailRow({ email, onSaved }: { email: string | null; onSaved: () => Promise<unknown> }) {
  const { t } = useLang();
  const T = t.setup;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(email ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setError("");
    setSaving(true);
    try {
      await api.updateEmail(value.trim());
      await onSaved();
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : T.emailSaveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)" }}
      >
        <span style={{ fontSize: 13, color: "var(--text-2)" }}>{T.emailLabel}</span>
        <button
          onClick={() => {
            setValue(email ?? "");
            setError("");
            setOpen(true);
          }}
          style={{ border: "none", background: "none", fontSize: 13, fontWeight: 700, color: email ? "var(--text)" : "var(--primary)" }}
        >
          {email ?? T.addEmailBtn}
        </button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={T.emailModalTitle}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label={T.emailLabel} hint={T.emailModalHint}>
            <TextInput type="email" value={value} onChange={(e) => setValue(e.target.value)} placeholder="you@example.com" autoFocus />
          </Field>
          {error && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{error}</div>}
          <Button full onClick={save} disabled={saving}>
            {saving ? t.common.savingBtn : T.saveEmailBtn}
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default function SetupPage() {
  const { user, logout, refresh } = useAuth();
  const router = useRouter();
  const { lang, t } = useLang();
  const T = t.setup;
  const diabetesTypes = diabetesTypesFor(lang);

  if (!user?.profile) return null;
  const profile = user.profile;
  const isPremium = user.subscription.isPremium;
  const usesInsulin = profile.tdd > 0;

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 104px", display: "flex", flexDirection: "column", gap: 16 }}>
      <DashboardCard
        icon={<ClipboardIcon />}
        title={T.setupRatiosTitle}
        tone="teal"
        right={isPremium ? <Badge tone="good">{T.premiumBadge}</Badge> : <Badge tone="neutral">{T.freeBadge}</Badge>}
      >
        <InfoRow label={T.usernameLabel} value={`@${user.username}`} />
        <EmailRow email={user.email} onSaved={refresh} />
        <InfoRow
          label={T.genderLabel}
          value={
            profile.gender === "female"
              ? t.onboarding.female
              : profile.gender === "male"
                ? t.onboarding.male
                : t.common.dash
          }
        />
        <InfoRow label={T.ageLabel} value={profile.age || t.common.dash} />
        <InfoRow label={T.dateDiagnosedLabel} value={profile.diagnosisDate || t.common.dash} />
        <InfoRow label={T.diabetesTypeLabel} value={diabetesTypes.find((dt) => dt.id === profile.diabetesType)?.label ?? t.common.dash} />
        <InfoRow label={T.glucoseUnitsLabel} value={profile.units === "mmol" ? "mmol/L" : "mg/dL"} />
        <InfoRow
          label={T.treatmentLabel}
          value={
            profile.treatmentMode === "insulin"
              ? t.onboarding.insulin
              : profile.treatmentMode === "pills"
                ? t.onboarding.pills
                : t.onboarding.both
          }
        />
        {usesInsulin && <InfoRow label={T.deliveryLabel} value={profile.insulinDelivery === "pump" ? t.onboarding.pump : t.onboarding.injections} />}
        {profile.pills && profile.pills.length > 0 && <InfoRow label={T.pillsLabel} value={profile.pills.join(", ")} />}
      </DashboardCard>

      {usesInsulin && (
        <DashboardCard icon={<CalculatorIcon />} title={T.autoRatiosTitle} tone="primary">
          <div style={{ display: "flex", gap: 10 }}>
            <RatioCard
              label={T.carbRatioTDDLabel}
              value={profile.carbRatio ? round2(profile.carbRatio) : t.common.dash}
              unit="g/u"
              tone="primary"
              recalculateLabel={T.recalculateBtn}
              onRecalculate={() => router.push("/onboarding")}
            />
            <RatioCard
              label={T.insulinSensitivityLabel}
              value={profile.isf ? round2(profile.isf) : t.common.dash}
              unit="mg/dL/u"
              tone="neutral"
              recalculateLabel={T.recalculateBtn}
              onRecalculate={() => router.push("/onboarding")}
            />
          </div>
          {profile.carbRatioOverridden && <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{T.doctorValuesNote}</div>}
        </DashboardCard>
      )}

      {!isPremium && (
        <DashboardCard icon={<CrownIcon />} title={T.unlockPremiumTitle} tone="surface" style={{ background: "var(--warn-tint)", border: "none" }}>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>{T.unlockPremiumDesc}</div>
          <Button onClick={() => router.push("/premium")}>{T.subscribeBtn}</Button>
        </DashboardCard>
      )}

      <Button variant="secondary" full onClick={() => router.push("/onboarding")}>
        {T.editTreatmentBtn}
      </Button>
      <Button variant="ghost" onClick={handleLogout}>
        {T.logoutBtn}
      </Button>
    </div>
  );
}
