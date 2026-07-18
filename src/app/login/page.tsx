"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell, SegmentedControl, Field, TextInput, Button } from "@/components/ui";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";

export default function LoginPage() {
  const { lang, setLang, strings: S } = useLang();
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
    if (!username.trim() || !password.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const result =
        mode === "signup"
          ? await api.signup(username.trim(), password, email.trim() || undefined)
          : await api.login(username.trim(), password);
      await refresh();
      router.replace(result.hasProfile ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div
        style={{
          background: "var(--header)",
          padding: "56px 28px 40px",
          borderRadius: "0 0 40px 40px",
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
            background: "oklch(100% 0 0 / 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 6,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24">
            <path
              d="M12 2c4 5 7 8.5 7 12.5A7 7 0 0 1 5 14.5C5 10.5 8 7 12 2Z"
              fill="var(--header-text)"
            />
          </svg>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 32,
            fontWeight: 700,
            margin: 0,
            color: "var(--header-text)",
            letterSpacing: "-0.01em",
          }}
        >
          GlucoDose
        </h1>
        <p style={{ fontSize: 15, color: "var(--header-text)", opacity: 0.8, margin: 0, lineHeight: 1.5, maxWidth: 320 }}>
          {S.appTagline}
        </p>
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
            { value: "login", label: S.login },
            { value: "signup", label: S.signup },
          ]}
        />

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 22 }}>
          <Field label="Username">
            <TextInput
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. mona_h"
              autoComplete="username"
            />
          </Field>
          <Field label="Password">
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </Field>
          {mode === "signup" && (
            <Field label="Email" hint="Optional — lets you reset your password if you forget it">
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>
          )}
          {error && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{error}</div>}
          <Button type="submit" full size="lg" disabled={submitting} style={{ marginTop: 8 }}>
            {submitting ? "Please wait…" : mode === "signup" ? S.signup : S.login}
          </Button>
          {mode === "login" && (
            <Link
              href="/forgot-password"
              style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--primary)" }}
            >
              Forgot password?
            </Link>
          )}
        </form>

        <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 28, textAlign: "center", lineHeight: 1.6 }}>
          This app supports diabetes self-management and does not replace medical advice. Always confirm
          dosing decisions with your care team.
        </p>
      </div>
    </AppShell>
  );
}
