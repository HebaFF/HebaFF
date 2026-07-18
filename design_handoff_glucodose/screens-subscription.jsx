// ---- Subscription / Premium: one free trial, then one-time purchase ----
const ONE_TIME_PRICE = "$29.99";

const PREMIUM_FEATURES = [
  "Full searchable food database, unlimited history",
  "Export history as CSV for your doctor",
  "Trend insights across meals & glucose readings",
  "Multiple insulin/pill regimen profiles",
];

const TRIAL_DAYS = 7;

function SubscriptionScreen({ isPremium, trialUsed, trialStartedAt, onStartTrial, onSubscribe }) {
  const daysLeft = trialStartedAt ? Math.max(0, TRIAL_DAYS - Math.floor((Date.now() - trialStartedAt) / 86400000)) : 0;
  const trialActive = trialUsed && !isPremium && daysLeft > 0;

  if (isPremium) {
    return (
      <div style={{ flex: 1, padding: "6px 20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        <Card style={{ background: "var(--good-tint)", border: "none", textAlign: "center", padding: 28 }}>
          <div style={{ fontSize: 30 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--good)", marginTop: 8 }}>You're Premium</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>Unlocked for life — unlimited history, export, and more.</div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, background: "var(--primary)", margin: "0 auto 12px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 8l3 3 5-6 5 6 3-3-2 11H6L4 8Z" fill="white"/></svg>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>GlucoDose Premium</div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", marginTop: 4 }}>Everything you need to manage diabetes with confidence.</div>
      </div>

      {trialActive && (
        <Card style={{ background: "var(--primary-tint)", border: "none", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>Free trial active — {daysLeft} day{daysLeft === 1 ? "" : "s"} left</div>
          <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>Subscribe below to keep Premium after your trial ends.</div>
        </Card>
      )}
      {trialUsed && !trialActive && (
        <Card style={{ background: "var(--surface-2)", border: "none", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Your free trial has ended</div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PREMIUM_FEATURES.map(f => (
          <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 20, height: 20, borderRadius: 999, background: "var(--good-tint)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
              <svg width="11" height="11" viewBox="0 0 16 16"><path d="M3 8.5 6 11.5 13 4.5" stroke="var(--good)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ fontSize: 13.5, color: "var(--text)" }}>{f}</div>
          </div>
        ))}
      </div>

      <Card style={{ textAlign: "center", background: "var(--primary-tint)", border: "none" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>One-time purchase</div>
        <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, marginTop: 4 }}>{ONE_TIME_PRICE}</div>
        <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>Pay once, keep Premium forever</div>
      </Card>

      {!trialUsed && (
        <Button size="lg" full variant="secondary" onClick={onStartTrial}>Start {TRIAL_DAYS}-day free trial</Button>
      )}
      <Button size="lg" full onClick={onSubscribe}>Unlock Premium</Button>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", textAlign: "center", lineHeight: 1.5 }}>
        This is a prototype — no payment is processed.
      </div>
    </div>
  );
}

window.SubscriptionScreen = SubscriptionScreen;
