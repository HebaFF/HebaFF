// ---- Shared UI components ----
const { useState, useRef, useEffect } = React;

const shellStyles = {
  page: {
    minHeight: "100vh",
    background: "var(--bg)",
    display: "flex",
    justifyContent: "center",
  },
  frame: {
    width: "100%",
    maxWidth: 480,
    minHeight: "100vh",
    background: "var(--bg)",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    boxShadow: "0 0 0 1px var(--border)",
  },
};

function AppShell({ children }) {
  return (
    <div style={shellStyles.page}>
      <div style={shellStyles.frame}>{children}</div>
    </div>
  );
}

function TopBar({ title, onBack, right }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "22px 20px 16px", position: "sticky", top: 0,
      background: "var(--bg)", zIndex: 5,
    }}>
      {onBack && (
        <button onClick={onBack} aria-label="Back" style={{
          width: 36, height: 36, borderRadius: 999, border: "none",
          background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M10 2 4 8l6 6" stroke="var(--text)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      <div style={{ flex: 1, fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</div>
      {right}
    </div>
  );
}

function Avatar({ name }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 999, background: "oklch(100% 0 0 / 0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 17, fontWeight: 800, color: "var(--header-text)", flexShrink: 0,
    }}>{(name || "?").slice(0, 1).toUpperCase()}</div>
  );
}

function TopNav({ name, age, tab, onChange, tabs }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 5, background: "var(--bg)" }}>
      <div style={{
        background: "var(--header)", margin: "14px 14px 0", borderRadius: "var(--radius)",
        padding: "16px 18px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <Avatar name={name} />
        <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--header-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Welcome back{name ? `, ${name}` : ""}!</div>
          {age && <div style={{ fontSize: 12.5, color: "var(--header-text)", opacity: 0.8 }}>Age: {age}</div>}
        </div>
      </div>
      <div style={{
        display: "flex", gap: 0, padding: "12px 20px 12px", background: "var(--bg)",
      }}>
        {tabs.map((t, i) => (
          <React.Fragment key={t.id}>
            <button onClick={() => onChange(t.id)} style={{
              border: "none", background: "none", padding: "4px 0", fontSize: 13.5,
              fontWeight: tab === t.id ? 800 : 600,
              color: tab === t.id ? "var(--primary)" : "var(--text-3)",
            }}>{t.label}</button>
            {i < tabs.length - 1 && <span style={{ color: "var(--border)", padding: "0 10px" }}>|</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function DashboardCard({ icon, title, right, children, style }) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 14, ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon && <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>}
          <span style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700 }}>{title}</span>
        </div>
        {right}
      </div>
      {children}
    </Card>
  );
}

function RingProgress({ pct, label, sublabel, color = "var(--good)" }) {
  const deg = Math.max(0, Math.min(100, pct)) * 3.6;
  return (
    <div style={{
      width: 148, height: 148, borderRadius: "999px", margin: "0 auto",
      background: `conic-gradient(${color} ${deg}deg, var(--surface-2) 0deg)`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 116, height: 116, borderRadius: 999, background: "var(--surface)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
      }}>
        {label && <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", textAlign: "center" }}>{label}</div>}
        <div className="num" style={{ fontSize: 28, fontWeight: 700 }}>{Math.round(pct)}%</div>
        {sublabel && <div style={{ fontSize: 11.5, fontWeight: 700, color }}>{sublabel}</div>}
      </div>
    </div>
  );
}

function TabIcon({ kind, active }) {
  const c = active ? "var(--primary)" : "var(--text-3)";
  const sw = active ? 2 : 1.6;
  const icons = {
    calc: <><rect x="5" y="3" width="14" height="18" rx="4" stroke={c} strokeWidth={sw} fill="none"/><circle cx="9" cy="8.5" r="1.2" fill={c}/><circle cx="12" cy="8.5" r="1.2" fill={c}/><circle cx="15" cy="8.5" r="1.2" fill={c}/><circle cx="9" cy="13" r="1.2" fill={c}/><circle cx="12" cy="13" r="1.2" fill={c}/><circle cx="15" cy="13" r="1.2" fill={c}/></>,
    history: <path d="M12 21a9 9 0 1 0-9-9 M3 12h4 M12 7v5l3 2" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    profile: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    premium: <path d="M4 8l3 3 5-6 5 6 3-3-2 11H6L4 8Z" stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
  };
  return <svg width="21" height="21" viewBox="0 0 24 24">{icons[kind]}</svg>;
}

function BottomTabBar({ active, onChange, labels }) {
  const tabs = [
    { id: "calculator", label: labels?.calculator || "Calculator", icon: "calc" },
    { id: "history", label: labels?.history || "History", icon: "history" },
    { id: "premium", label: labels?.premium || "Premium", icon: "premium" },
    { id: "profile", label: labels?.profile || "Profile", icon: "profile" },
  ];
  return (
    <div style={{ padding: "0 14px 18px", position: "sticky", bottom: 0, zIndex: 5 }}>
      <div style={{
        display: "flex", background: "var(--surface)", borderRadius: 999,
        boxShadow: "var(--shadow)", border: "1px solid var(--border)", padding: 6, gap: 2,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, border: "none", borderRadius: 999,
            background: active === t.id ? "var(--primary-tint)" : "transparent",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            padding: "9px 0 8px", color: active === t.id ? "var(--primary-dark)" : "var(--text-3)",
            fontSize: 10.5, fontWeight: 700,
            transition: "background 0.15s ease",
          }}>
            <TabIcon kind={t.icon} active={active === t.id} />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Button({ children, variant = "primary", size = "md", full, onClick, disabled, type = "button", style }) {
  const base = {
    border: "none", borderRadius: 999, fontWeight: 700, cursor: disabled ? "default" : "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: full ? "100%" : "auto", opacity: disabled ? 0.5 : 1,
    fontFamily: "var(--font-ui)",
  };
  const sizes = {
    sm: { padding: "9px 15px", fontSize: 13 },
    md: { padding: "14px 22px", fontSize: 15 },
    lg: { padding: "17px 24px", fontSize: 16.5 },
  };
  const variants = {
    primary: { background: "var(--primary)", color: "white" },
    secondary: { background: "var(--surface-2)", color: "var(--text)" },
    outline: { background: "transparent", color: "var(--primary-dark)", border: "1.5px solid var(--primary)" },
    danger: { background: "var(--danger)", color: "white" },
    ghost: { background: "transparent", color: "var(--text-2)" },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: 18, ...style,
    }}>
      {children}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {label && <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</span>}
      {children}
      {hint && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{hint}</span>}
    </label>
  );
}

const inputBase = {
  width: "100%", padding: "13px 15px", borderRadius: "var(--radius-sm)",
  border: "1.5px solid var(--border)", background: "var(--surface-2)",
  fontSize: 15, color: "var(--text)", outline: "none",
};

function TextInput(props) {
  return <input {...props} style={{ ...inputBase, ...(props.style || {}) }} />;
}

function Select({ value, onChange, options, placeholder, style }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputBase, ...style }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        typeof o === "string"
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div style={{
      display: "flex", background: "var(--surface-2)", borderRadius: 999, padding: 4, gap: 2,
    }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          flex: 1, border: "none", borderRadius: 999, padding: "10px 8px", fontSize: 13, fontWeight: 700,
          background: value === o.value ? "var(--surface)" : "transparent",
          color: value === o.value ? "var(--primary-dark)" : "var(--text-2)",
          boxShadow: value === o.value ? "var(--shadow)" : "none",
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function Badge({ children, tone = "primary" }) {
  const tones = {
    primary: { bg: "var(--primary-tint)", fg: "var(--primary-dark)" },
    good: { bg: "var(--good-tint)", fg: "var(--good)" },
    warn: { bg: "var(--warn-tint)", fg: "oklch(45% 0.13 75)" },
    danger: { bg: "var(--danger-tint)", fg: "var(--danger)" },
    neutral: { bg: "var(--surface-2)", fg: "var(--text-2)" },
  };
  const t = tones[tone];
  return (
    <span style={{
      background: t.bg, color: t.fg, fontSize: 11.5, fontWeight: 800,
      padding: "4px 11px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 4,
      textTransform: "uppercase", letterSpacing: "0.02em",
    }}>{children}</span>
  );
}

const CHIP_LETTERS = { primary: "R", good: "S", warn: "C", neutral: "•" };
function StatTile({ label, value, unit, tone = "primary" }) {
  const colorVar = tone === "neutral" ? "var(--text-2)" : `var(--${tone})`;
  const tintVar = tone === "neutral" ? "var(--surface-2)" : `var(--${tone}-tint)`;
  return (
    <div style={{
      flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
      padding: "14px 10px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 999, background: tintVar, color: colorVar,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800,
        fontFamily: "var(--font-display)",
      }}>{CHIP_LETTERS[tone] || "•"}</div>
      <div className="num" style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>
        {value}<span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2, color: "var(--text-3)" }}>{unit}</span>
      </div>
      <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em" }}>{label}</div>
    </div>
  );
}

function ProgressDots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 6, padding: "0 20px 16px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 4,
          background: i <= current ? "var(--primary)" : "var(--border)",
        }} />
      ))}
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "oklch(20% 0.01 255 / 0.55)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg)", borderRadius: "26px 26px 0 0", padding: 22,
        width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{
            border: "none", background: "var(--surface-2)", borderRadius: 999,
            width: 32, height: 32, fontSize: 17, color: "var(--text-2)",
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, {
  AppShell, TopBar, BottomTabBar, Button, Card, Field, TextInput, Select,
  SegmentedControl, Badge, StatTile, ProgressDots, Modal, TabIcon,
  TopNav, DashboardCard, RingProgress, Avatar,
});
