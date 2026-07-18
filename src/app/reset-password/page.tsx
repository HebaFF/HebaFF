"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell, TopBar, Field, TextInput, Button, Card } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();
  const { refresh } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("This reset link is missing its token.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      await refresh();
      setDone(true);
      setTimeout(() => router.replace("/dashboard"), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <TopBar title="Set a new password" />
      <div style={{ flex: 1, padding: "6px 20px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
        {!token && (
          <Card style={{ background: "var(--danger-tint)", border: "none" }}>
            <div style={{ fontSize: 13.5, color: "var(--danger)", fontWeight: 600 }}>
              This link is missing its reset token. Request a new one from the forgot password page.
            </div>
          </Card>
        )}

        {done ? (
          <Card style={{ background: "var(--good-tint)", border: "none", textAlign: "center" }}>
            <div style={{ fontSize: 13.5, color: "var(--good)", fontWeight: 700 }}>
              Password updated — taking you to your dashboard…
            </div>
          </Card>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="New password">
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                autoFocus
              />
            </Field>
            <Field label="Confirm new password">
              <TextInput
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            {error && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{error}</div>}
            <Button type="submit" full size="lg" disabled={submitting || !token}>
              {submitting ? "Saving…" : "Reset password"}
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
