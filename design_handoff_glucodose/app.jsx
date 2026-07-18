// ---- Root app: routing, persistence ----
const { useState: useStateApp, useEffect: useEffectApp } = React;

const STORAGE_KEY = "glucodose_v1";

const BG_PRESETS = {
  light: { bg: "oklch(99% 0.004 145)", surface: "oklch(100% 0 0)", surface2: "oklch(95.5% 0.02 145)", border: "oklch(91% 0.014 145)", text: "oklch(16% 0.02 145)" },
  cream: { bg: "oklch(97.5% 0.02 90)", surface: "oklch(100% 0 0)", surface2: "oklch(93% 0.035 85)", border: "oklch(87% 0.03 85)", text: "oklch(20% 0.02 85)" },
  mint: { bg: "oklch(97% 0.025 155)", surface: "oklch(100% 0 0)", surface2: "oklch(92% 0.045 155)", border: "oklch(85% 0.04 155)", text: "oklch(16% 0.03 155)" },
  dark: { bg: "oklch(17% 0.015 150)", surface: "oklch(21% 0.018 150)", surface2: "oklch(26% 0.02 150)", border: "oklch(33% 0.02 150)", text: "oklch(96% 0.008 150)" },
};
const TWEAK_DEFAULTS = { background: "light" };

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { users: {} };
}
function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function App() {
  const [store, setStore] = useStateApp(loadStore);
  const [session, setSession] = useStateApp(null); // username of logged-in user
  const [screen, setScreen] = useStateApp("auth"); // auth | onboarding | main
  const [tab, setTab] = useStateApp("dashboard");
  const [editingTreatment, setEditingTreatment] = useStateApp(false);
  const [lang, setLang] = useStateApp(() => localStorage.getItem("glucodose_lang") || "en");
  const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  useEffectApp(() => {
    localStorage.setItem("glucodose_lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  useEffectApp(() => { saveStore(store); }, [store]);
  useEffectApp(() => {
    const preset = BG_PRESETS[t.background] || BG_PRESETS.light;
    const root = document.documentElement.style;
    root.setProperty("--bg", preset.bg);
    root.setProperty("--surface", preset.surface);
    root.setProperty("--surface-2", preset.surface2);
    root.setProperty("--border", preset.border);
    root.setProperty("--text", preset.text);
  }, [t.background]);

  const user = session ? store.users[session] : null;
  const STR = window.STRINGS[lang];

  function updateUser(username, patch) {
    setStore(s => ({ ...s, users: { ...s.users, [username]: { ...s.users[username], ...patch } } }));
  }

  function handleAuthed({ username, password, isNewUser }) {
    const existing = store.users[username];
    if (isNewUser) {
      if (existing) { alert("That username is taken — try logging in instead."); return; }
      setStore(s => ({ ...s, users: { ...s.users, [username]: { username, password, profile: null, entries: [], customFoods: [], isPremium: false } } }));
      setSession(username);
      setScreen("onboarding");
      return;
    }
    if (!existing || existing.password !== password) { alert("Incorrect username or password."); return; }
    setSession(username);
    setScreen(existing.profile ? "main" : "onboarding");
  }

  function handleOnboardingComplete(profileData) {
    updateUser(session, { profile: profileData });
    setEditingTreatment(false);
    setScreen("main");
    setTab("dashboard");
  }

  function handleLogEntry(entry) {
    updateUser(session, { entries: [...(user.entries || []), entry] });
  }
  function handleAddCustomFood(food) {
    updateUser(session, { customFoods: [...(user.customFoods || []), food] });
  }
  function handleSubscribe() {
    updateUser(session, { isPremium: true });
    setTab("premium");
  }
  function handleStartTrial() {
    updateUser(session, { trialUsed: true, trialStartedAt: Date.now() });
  }
  function handleLogout() {
    setSession(null);
    setScreen("auth");
  }

  if (screen === "auth" || !user) {
    return <AuthScreen onAuthed={handleAuthed} lang={lang} strings={STR} onSetLang={setLang} />;
  }

  if (screen === "onboarding" || editingTreatment) {
    return (
      <AppShell>
        <OnboardingScreen
          initial={editingTreatment ? user.profile : undefined}
          onComplete={handleOnboardingComplete}
        />
      </AppShell>
    );
  }

  const titles = { calculator: STR.tabCalculator, history: STR.tabHistory, premium: STR.tabPremium, profile: STR.tabProfile };
  return (
    <AppShell>
      <TopNav
        name={user.profile.name}
        age={user.profile.age}
        tab={tab}
        onChange={setTab}
        tabs={[
          { id: "dashboard", label: "Dashboard" },
          { id: "setup", label: "Setup" },
          { id: "history", label: "History" },
          { id: "premium", label: "Premium" },
        ]}
      />
      {tab === "dashboard" && (
        <DashboardScreen
          profile={user.profile}
          entries={user.entries || []}
          customFoods={user.customFoods || []}
          onAddCustomFood={handleAddCustomFood}
          onLog={handleLogEntry}
          isPremium={!!user.isPremium}
          units={user.profile.units}
          onGoTab={setTab}
        />
      )}
      {tab === "history" && (
        <HistoryScreen
          entries={user.entries || []}
          units={user.profile.units}
          onAddBG={handleLogEntry}
          isPremium={!!user.isPremium}
          onGoPremium={() => setTab("premium")}
        />
      )}
      {tab === "premium" && (
        <SubscriptionScreen
          isPremium={!!user.isPremium}
          trialUsed={!!user.trialUsed}
          trialStartedAt={user.trialStartedAt}
          onStartTrial={handleStartTrial}
          onSubscribe={handleSubscribe}
        />
      )}
      {tab === "setup" && (
        <ProfileScreen
          profile={{ ...user.profile, username: user.username }}
          isPremium={!!user.isPremium}
          onEditTreatment={() => setEditingTreatment(true)}
          onGoPremium={() => setTab("premium")}
          onLogout={handleLogout}
        />
      )}
      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakSelect label="Background" value={t.background} options={[
          { value: "light", label: "Light" },
          { value: "cream", label: "Cream" },
          { value: "mint", label: "Mint" },
          { value: "dark", label: "Dark" },
        ]} onChange={v => setTweak("background", v)} />
        <TweakRadio label={STR.language} value={lang} options={[{ value: "en", label: "English" }, { value: "ar", label: "العربية" }]} onChange={setLang} />
      </TweaksPanel>
    </AppShell>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
