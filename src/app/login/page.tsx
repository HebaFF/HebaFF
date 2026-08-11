"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell, SegmentedControl, Field, TextInput, PasswordInput, Button } from "@/components/ui";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";

export default function LoginPage() {
  const { lang, setLang, t } = useLang();
  const { refresh } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim() || (mode === "signup" && !email.trim())) {
      setError(t.auth.fillRequiredFields);
      return;
    }
    if (password.length < 8) {
      setError(t.auth.passwordTooShort);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const result =
        mode === "signup"
          ? await api.signup(username.trim(), password, email.trim())
          : await api.login(username.trim(), password);
      await refresh();
      router.replace(result.hasProfile ? "/home" : "/onboarding");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.common.somethingWrong);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div
        style={{
          background: "var(--primary-tint)",
          padding: "56px 28px 40px",
          borderRadius: "0 0 32px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: "var(--primary-gradient)",
            boxShadow: "var(--primary-shadow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 6,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24">
            <path d="M12 2c4 5 7 8.5 7 12.5A7 7 0 0 1 5 14.5C5 10.5 8 7 12 2Z" fill="white" />
          </svg>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 32,
            fontWeight: 700,
            margin: 0,
            color: "var(--primary-dark)",
            letterSpacing: "-0.01em",
          }}
        >
          GlucoDose
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-2)", margin: 0, lineHeight: 1.5, maxWidth: 320 }}>{t.auth.appTagline}</p>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "28px 28px 40px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <SegmentedControl
            value={lang}
            onChange={setLang}
            options={[
              { value: "en", label: "EN" },
              { value: "ar", label: "AR" },
            ]}
          />
        </div>
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: "login", label: t.auth.login },
            { value: "signup", label: t.auth.signup },
          ]}
        />

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 22 }}>
          <Field label={t.auth.usernameLabel}>
            <TextInput
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.auth.usernamePlaceholder}
              autoComplete="username"
            />
          </Field>
          <Field label={t.auth.passwordLabel}>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </Field>
          {mode === "signup" && (
            <Field label={t.auth.emailLabel} hint={t.auth.emailHint}>
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.auth.emailPlaceholder}
                autoComplete="email"
              />
            </Field>
          )}
          {error && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{error}</div>}
          <Button type="submit" full size="lg" disabled={submitting} style={{ marginTop: 8 }}>
            {submitting ? t.auth.pleaseWait : mode === "signup" ? t.auth.signup : t.auth.login}
          </Button>
          {mode === "login" && (
            <Link
              href="/forgot-password"
              style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--primary)" }}
            >
              {t.auth.forgotPassword}
            </Link>
          )}
        </form>

        <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 28, textAlign: "center", lineHeight: 1.6 }}>
          {t.auth.disclaimer}
        </p>
      </div>
    </AppShell>
  );
}
