"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell, TopBar, Field, PasswordInput, Button, Card } from "@/components/ui";
import { useLang } from "@/context/LangContext";
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
  const { t } = useLang();
  const T = t.resetPassword;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError(T.missingTokenError);
      return;
    }
    if (password.length < 8) {
      setError(t.auth.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      setError(T.passwordsDontMatch);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      await refresh();
      setDone(true);
      setTimeout(() => router.replace("/home"), 1200);
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
        {!token && (
          <Card style={{ background: "var(--danger-tint)", border: "none" }}>
            <div style={{ fontSize: 13.5, color: "var(--danger)", fontWeight: 600 }}>{T.missingTokenMessage}</div>
          </Card>
        )}

        {done ? (
          <Card style={{ background: "var(--good-tint)", border: "none", textAlign: "center" }}>
            <div style={{ fontSize: 13.5, color: "var(--good)", fontWeight: 700 }}>{T.passwordUpdatedMessage}</div>
          </Card>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label={T.newPasswordLabel}>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                autoFocus
              />
            </Field>
            <Field label={T.confirmPasswordLabel}>
              <PasswordInput
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            {error && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{error}</div>}
            <Button type="submit" full size="lg" disabled={submitting || !token}>
              {submitting ? t.common.savingBtn : T.resetPasswordBtn}
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
