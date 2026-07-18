// ---- Setup: profile + clinical info + auto-ratios ----
function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 13, color: "var(--text-2)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function RatioCard({ label, value, unit, tone, onRecalculate }) {
  const colorVar = tone === "neutral" ? "var(--text)" : `var(--${tone})`;
  return (
    <div style={{
      flex: 1, background: "var(--surface-2)", borderRadius: "var(--radius-sm)",
      padding: 14, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", textAlign: "center",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>{label}</div>
      <div className="num" style={{ fontSize: 20, fontWeight: 700, color: colorVar }}>{value}<span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 2 }}>{unit}</span></div>
      <Button size="sm" variant="secondary" onClick={onRecalculate}>Recalculate</Button>
    </div>
  );
}

function ProfileScreen({ profile, isPremium, onEditTreatment, onGoPremium, onLogout }) {
  const usesInsulin = profile.tdd > 0;
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
      <DashboardCard icon="📋" title="Setup & Ratios" right={isPremium ? <Badge tone="good">Premium</Badge> : <Badge tone="neutral">Free</Badge>}>
        <InfoRow label="Username" value={`@${profile.username}`} />
        <InfoRow label="Gender" value={profile.gender || "—"} />
        <InfoRow label="Age" value={profile.age || "—"} />
        <InfoRow label="Date diagnosed" value={profile.diagnosisDate || "—"} />
        <InfoRow label="Diabetes type" value={(window.DIABETES_TYPES.find(t => t.id === profile.diabetesType) || {}).label || "—"} />
        <InfoRow label="Glucose units" value={profile.units === "mmol" ? "mmol/L" : "mg/dL"} />
        <InfoRow label="Treatment" value={profile.treatmentMode} />
        {usesInsulin && <InfoRow label="Delivery" value={profile.insulinDelivery === "pump" ? "Insulin pump" : "Injections (MDI)"} />}
        {profile.pills && profile.pills.length > 0 && <InfoRow label="Pills" value={profile.pills.join(", ")} />}
      </DashboardCard>

      {usesInsulin && (
        <DashboardCard icon="🧮" title="Auto-Ratios">
          <div style={{ display: "flex", gap: 10 }}>
            <RatioCard label="Carb ratio (TDD)" value={window.round2(profile.carbRatio)} unit="g/u" tone="primary" onRecalculate={onEditTreatment} />
            <RatioCard label="Insulin sensitivity" value={window.round2(profile.isf)} unit="mg/dL/u" tone="neutral" onRecalculate={onEditTreatment} />
          </div>
          {profile.carbRatioOverridden && <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>Using your doctor's custom values.</div>}
        </DashboardCard>
      )}

      {!isPremium && (
        <DashboardCard icon="👑" title="Unlock Premium" style={{ background: "var(--surface-2)", border: "none" }}>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>Unlimited history, PDF reports, CGM sync.</div>
          <Button onClick={onGoPremium}>Subscribe</Button>
        </DashboardCard>
      )}

      <Button variant="secondary" full onClick={onEditTreatment}>Edit treatment info</Button>
      <Button variant="ghost" onClick={onLogout}>Log out</Button>
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
