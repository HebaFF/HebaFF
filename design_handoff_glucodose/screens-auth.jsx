// ---- Auth: Login / Signup ----
const { useState: useStateAuth } = React;

function AuthScreen({ onAuthed, lang = "en", strings, onSetLang }) {
  const S = strings || window.STRINGS.en;
  const [mode, setMode] = useStateAuth("login"); // login | signup
  const [username, setUsername] = useStateAuth("");
  const [password, setPassword] = useStateAuth("");
  const [error, setError] = useStateAuth("");

  function submit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    setError("");
    onAuthed({ username: username.trim(), password, isNewUser: mode === "signup" });
  }

  return (
    <AppShell>
      <div style={{
        background: "var(--header)", padding: "56px 28px 40px", borderRadius: "0 0 40px 40px",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, background: "oklch(100% 0 0 / 0.55)",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 2c4 5 7 8.5 7 12.5A7 7 0 0 1 5 14.5C5 10.5 8 7 12 2Z" fill="var(--header-text)"/></svg>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, margin: 0, color: "var(--header-text)", letterSpacing: "-0.01em" }}>GlucoDose</h1>
        <p style={{ fontSize: 15, color: "var(--header-text)", opacity: 0.8, margin: 0, lineHeight: 1.5, maxWidth: 320 }}>
          {S.appTagline}
        </p>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "28px 28px 40px" }}>
        {onSetLang && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <SegmentedControl value={lang} onChange={onSetLang} options={[{ value: "en", label: "EN" }, { value: "ar", label: "AR" }]} />
          </div>
        )}
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[{ value: "login", label: S.login }, { value: "signup", label: S.signup }]}
        />

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 22 }}>
          <Field label="Username">
            <TextInput value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. mona_h" autoComplete="username" />
          </Field>
          <Field label="Password">
            <TextInput type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === "signup" ? "new-password" : "current-password"} />
          </Field>
          {error && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{error}</div>}
          <Button type="submit" full size="lg" style={{ marginTop: 8 }}>
            {mode === "signup" ? S.signup : S.login}
          </Button>
        </form>

        <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 28, textAlign: "center", lineHeight: 1.6 }}>
          This app supports diabetes self-management and does not replace medical advice.
          Always confirm dosing decisions with your care team.
        </p>
      </div>
    </AppShell>
  );
}

window.AuthScreen = AuthScreen;
