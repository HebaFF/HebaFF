"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell, TopBar, Field, TextInput, Button, Card } from "@/components/ui";
import { useLang } from "@/context/LangContext";
import { api, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const { t } = useLang();
  const T = t.forgotPassword;
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [devResetUrl, setDevResetUrl] = useState<string | undefined>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const result = await api.forgotPassword(email.trim());
      setMessage(result.message);
      setDevResetUrl(result.devResetUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.common.somethingWrong);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <TopBar title={T.title} />
      <div style={{ flex: 1, padding: "6px 20px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
        <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>{T.description}</p>

        {message ? (
          <Card style={{ background: "var(--primary-tint)", border: "none" }}>
            <div style={{ fontSize: 13.5, color: "var(--primary-dark)", fontWeight: 600 }}>{message}</div>
            {devResetUrl && (
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-2)", wordBreak: "break-all" }}>
                {T.devModeNote}{" "}
                <Link href={devResetUrl.replace(/^https?:\/\/[^/]+/, "")} style={{ fontWeight: 700 }}>
                  {devResetUrl}
                </Link>
              </div>
            )}
          </Card>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label={T.emailLabel}>
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
              />
            </Field>
            {error && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{error}</div>}
            <Button type="submit" full size="lg" disabled={submitting}>
              {submitting ? T.sendingBtn : T.sendResetLinkBtn}
            </Button>
          </form>
        )}

        <Link href="/login" style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>
          {T.backToLogin}
        </Link>
      </div>
    </AppShell>
  );
}
