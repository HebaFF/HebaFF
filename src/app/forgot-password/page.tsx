"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell, TopBar, Field, TextInput, Button, Card } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
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
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <TopBar title="Reset your password" />
      <div style={{ flex: 1, padding: "6px 20px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
        <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
          Enter the email on your account and we&apos;ll send you a link to reset your password.
        </p>

        {message ? (
          <Card style={{ background: "var(--primary-tint)", border: "none" }}>
            <div style={{ fontSize: 13.5, color: "var(--primary-dark)", fontWeight: 600 }}>{message}</div>
            {devResetUrl && (
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-2)", wordBreak: "break-all" }}>
                Dev mode (no email provider configured) — reset link:{" "}
                <Link href={devResetUrl.replace(/^https?:\/\/[^/]+/, "")} style={{ fontWeight: 700 }}>
                  {devResetUrl}
                </Link>
              </div>
            )}
          </Card>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Email">
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
              {submitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <Link href="/login" style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>
          Back to log in
        </Link>
      </div>
    </AppShell>
  );
}
