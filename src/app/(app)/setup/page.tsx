"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardCard, Badge, Button, Modal, Field, TextInput } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { DIABETES_TYPES } from "@/lib/constants";
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
  onRecalculate,
}: {
  label: string;
  value: React.ReactNode;
  unit: string;
  tone: "primary" | "neutral";
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
        Recalculate
      </Button>
    </div>
  );
}

function EmailRow({ email, onSaved }: { email: string | null; onSaved: () => Promise<unknown> }) {
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
      setError(err instanceof ApiError ? err.message : "Could not save email.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)" }}
      >
        <span style={{ fontSize: 13, color: "var(--text-2)" }}>Email</span>
        <button
          onClick={() => {
            setValue(email ?? "");
            setError("");
            setOpen(true);
          }}
          style={{ border: "none", background: "none", fontSize: 13, fontWeight: 700, color: email ? "var(--text)" : "var(--primary)" }}
        >
          {email ?? "+ Add email"}
        </button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Email for password reset">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Email" hint="Used only to send you a password-reset link if you forget your password.">
            <TextInput type="email" value={value} onChange={(e) => setValue(e.target.value)} placeholder="you@example.com" autoFocus />
          </Field>
          {error && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{error}</div>}
          <Button full onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save email"}
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default function SetupPage() {
  const { user, logout, refresh } = useAuth();
  const router = useRouter();

  if (!user?.profile) return null;
  const profile = user.profile;
  const isPremium = user.subscription.isPremium;
  const usesInsulin = profile.tdd > 0;

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <DashboardCard icon="📋" title="Setup & Ratios" right={isPremium ? <Badge tone="good">Premium</Badge> : <Badge tone="neutral">Free</Badge>}>
        <InfoRow label="Username" value={`@${user.username}`} />
        <EmailRow email={user.email} onSaved={refresh} />
        <InfoRow label="Gender" value={profile.gender || "—"} />
        <InfoRow label="Age" value={profile.age || "—"} />
        <InfoRow label="Date diagnosed" value={profile.diagnosisDate || "—"} />
        <InfoRow label="Diabetes type" value={DIABETES_TYPES.find((t) => t.id === profile.diabetesType)?.label ?? "—"} />
        <InfoRow label="Glucose units" value={profile.units === "mmol" ? "mmol/L" : "mg/dL"} />
        <InfoRow label="Treatment" value={profile.treatmentMode} />
        {usesInsulin && <InfoRow label="Delivery" value={profile.insulinDelivery === "pump" ? "Insulin pump" : "Injections (MDI)"} />}
        {profile.pills && profile.pills.length > 0 && <InfoRow label="Pills" value={profile.pills.join(", ")} />}
      </DashboardCard>

      {usesInsulin && (
        <DashboardCard icon="🧮" title="Auto-Ratios">
          <div style={{ display: "flex", gap: 10 }}>
            <RatioCard label="Carb ratio (TDD)" value={profile.carbRatio ? round2(profile.carbRatio) : "—"} unit="g/u" tone="primary" onRecalculate={() => router.push("/onboarding")} />
            <RatioCard label="Insulin sensitivity" value={profile.isf ? round2(profile.isf) : "—"} unit="mg/dL/u" tone="neutral" onRecalculate={() => router.push("/onboarding")} />
          </div>
          {profile.carbRatioOverridden && <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>Using your doctor&apos;s custom values.</div>}
        </DashboardCard>
      )}

      {!isPremium && (
        <DashboardCard icon="👑" title="Unlock Premium" style={{ background: "var(--surface-2)", border: "none" }}>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>Unlimited history, PDF reports, CGM sync.</div>
          <Button onClick={() => router.push("/premium")}>Subscribe</Button>
        </DashboardCard>
      )}

      <Button variant="secondary" full onClick={() => router.push("/onboarding")}>
        Edit treatment info
      </Button>
      <Button variant="ghost" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  );
}
