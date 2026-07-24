"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { api, ApiError } from "@/lib/api";
import { ONE_TIME_PRICE_DISPLAY, TRIAL_DAYS } from "@/lib/constants";

export default function PremiumPage() {
  const { user, refresh } = useAuth();
  const { t } = useLang();
  const T = t.premium;
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Paymob's redirect URL is configured once in its dashboard (not passed
  // per-request like Stripe's success_url), so it always lands back on
  // /premium and appends its own query params — "success" is theirs.
  const paymobSuccess = searchParams.get("success");

  useEffect(() => {
    if (paymobSuccess === "true") {
      // Webhook flips is_premium asynchronously; poll briefly for it to land.
      let attempts = 0;
      const id = setInterval(async () => {
        attempts += 1;
        const { user } = await api.me();
        if (user?.subscription.isPremium || attempts >= 6) clearInterval(id);
        if (user) await refresh();
      }, 1500);
      return () => clearInterval(id);
    }
  }, [paymobSuccess, refresh]);

  if (!user) return null;
  const { isPremium, trialUsed, trialStartedAt } = user.subscription;
  // eslint-disable-next-line react-hooks/purity -- day-granularity countdown, sub-day render-time drift doesn't change the displayed value
  const daysLeft = trialStartedAt ? Math.max(0, TRIAL_DAYS - Math.floor((Date.now() - trialStartedAt) / 86400000)) : 0;
  const trialActive = trialUsed && !isPremium && daysLeft > 0;

  async function startTrial() {
    setBusy(true);
    setError("");
    try {
      await api.startTrial();
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : T.startTrialError);
    } finally {
      setBusy(false);
    }
  }

  async function subscribe() {
    setBusy(true);
    setError("");
    try {
      const { url } = await api.checkout();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : T.checkoutError);
      setBusy(false);
    }
  }

  if (isPremium) {
    return (
      <div style={{ padding: "6px 20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        <Card style={{ background: "var(--good-tint)", border: "none", textAlign: "center", padding: 28 }}>
          <div style={{ fontSize: 30 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--good)", marginTop: 8 }}>{T.premiumUnlockedTitle}</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>{T.premiumUnlockedDesc}</div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "6px 20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: "var(--primary)",
            margin: "0 auto 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24">
            <path d="M4 8l3 3 5-6 5 6 3-3-2 11H6L4 8Z" fill="white" />
          </svg>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{T.title}</div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", marginTop: 4 }}>{T.subtitle}</div>
      </div>

      {paymobSuccess === "true" && !isPremium && (
        <Card style={{ background: "var(--primary-tint)", border: "none", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>{T.paymentReceived}</div>
        </Card>
      )}
      {paymobSuccess === "false" && (
        <Card style={{ background: "var(--surface-2)", border: "none", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{T.checkoutCancelled}</div>
        </Card>
      )}

      {trialActive && (
        <Card style={{ background: "var(--primary-tint)", border: "none", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>{T.trialActive(daysLeft)}</div>
          <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>{T.trialSubtitle}</div>
        </Card>
      )}
      {trialUsed && !trialActive && (
        <Card style={{ background: "var(--surface-2)", border: "none", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{T.trialEnded}</div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {T.features.map((f) => (
          <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 999,
                background: "var(--good-tint)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 16 16">
                <path d="M3 8.5 6 11.5 13 4.5" stroke="var(--good)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: 13.5, color: "var(--text)" }}>{f}</div>
          </div>
        ))}
      </div>

      <Card style={{ textAlign: "center", background: "var(--primary-tint)", border: "none" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>{T.onetimePurchaseLabel}</div>
        <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, marginTop: 4 }}>
          {ONE_TIME_PRICE_DISPLAY}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>{T.payOnceMessage}</div>
      </Card>

      {error && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600, textAlign: "center" }}>{error}</div>}

      {!trialUsed && (
        <Button size="lg" full variant="secondary" onClick={startTrial} disabled={busy}>
          {T.startTrialBtn(TRIAL_DAYS)}
        </Button>
      )}
      <Button size="lg" full onClick={subscribe} disabled={busy}>
        {T.unlockPremiumBtn}
      </Button>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", textAlign: "center", lineHeight: 1.5 }}>{T.paymentsSecureNote}</div>
    </div>
  );
}
