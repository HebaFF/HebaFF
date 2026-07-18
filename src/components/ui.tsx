"use client";

// Shared UI primitives — ported 1:1 from design_handoff_glucodose/components.jsx.
// Keep styling pixel-for-pixel; this is the single source of design truth.
import React from "react";

const shellStyles: Record<string, React.CSSProperties> = {
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

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={shellStyles.page}>
      <div style={shellStyles.frame}>{children}</div>
    </div>
  );
}

export function TopBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "22px 20px 16px",
        position: "sticky",
        top: 0,
        background: "var(--bg)",
        zIndex: 5,
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Back"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: "none",
            background: "var(--surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d="M10 2 4 8l6 6"
              stroke="var(--text)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      <div
        style={{
          flex: 1,
          fontFamily: "var(--font-display)",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </div>
      {right}
    </div>
  );
}

export function Avatar({ name }: { name?: string }) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        background: "oklch(100% 0 0 / 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 17,
        fontWeight: 800,
        color: "var(--header-text)",
        flexShrink: 0,
      }}
    >
      {(name || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

export function TopNav({
  name,
  age,
  tab,
  onChange,
  tabs,
}: {
  name?: string;
  age?: number | string;
  tab: string;
  onChange: (id: string) => void;
  tabs: { id: string; label: string }[];
}) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 5, background: "var(--bg)" }}>
      <div
        style={{
          background: "var(--header)",
          margin: "14px 14px 0",
          borderRadius: "var(--radius)",
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Avatar name={name} />
        <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--header-text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Welcome back{name ? `, ${name}` : ""}!
          </div>
          {age && (
            <div style={{ fontSize: 12.5, color: "var(--header-text)", opacity: 0.8 }}>Age: {age}</div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 0, padding: "12px 20px 12px", background: "var(--bg)" }}>
        {tabs.map((t, i) => (
          <React.Fragment key={t.id}>
            <button
              onClick={() => onChange(t.id)}
              style={{
                border: "none",
                background: "none",
                padding: "4px 0",
                fontSize: 13.5,
                fontWeight: tab === t.id ? 800 : 600,
                color: tab === t.id ? "var(--primary)" : "var(--text-3)",
              }}
            >
              {t.label}
            </button>
            {i < tabs.length - 1 && <span style={{ color: "var(--border)", padding: "0 10px" }}>|</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function DashboardCard({
  icon,
  title,
  right,
  children,
  style,
}: {
  icon?: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
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

export function RingProgress({
  pct,
  label,
  sublabel,
  color = "var(--good)",
}: {
  pct: number;
  label?: string;
  sublabel?: string;
  color?: string;
}) {
  const deg = Math.max(0, Math.min(100, pct)) * 3.6;
  return (
    <div
      style={{
        width: 148,
        height: 148,
        borderRadius: "999px",
        margin: "0 auto",
        background: `conic-gradient(${color} ${deg}deg, var(--surface-2) 0deg)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 116,
          height: 116,
          borderRadius: 999,
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        {label && (
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", textAlign: "center" }}>
            {label}
          </div>
        )}
        <div className="num" style={{ fontSize: 28, fontWeight: 700 }}>
          {Math.round(pct)}%
        </div>
        {sublabel && <div style={{ fontSize: 11.5, fontWeight: 700, color }}>{sublabel}</div>}
      </div>
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export function Button({
  children,
  variant = "primary",
  size = "md",
  full,
  onClick,
  disabled,
  type = "button",
  style,
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    border: "none",
    borderRadius: 999,
    fontWeight: 700,
    cursor: disabled ? "default" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: full ? "100%" : "auto",
    opacity: disabled ? 0.5 : 1,
    fontFamily: "var(--font-ui)",
  };
  const sizes: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: "9px 15px", fontSize: 13 },
    md: { padding: "14px 22px", fontSize: 15 },
    lg: { padding: "17px 24px", fontSize: 16.5 },
  };
  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: { background: "var(--primary)", color: "white" },
    secondary: { background: "var(--surface-2)", color: "var(--text)" },
    outline: { background: "transparent", color: "var(--primary-dark)", border: "1.5px solid var(--primary)" },
    danger: { background: "var(--danger)", color: "white" },
    ghost: { background: "transparent", color: "var(--text-2)" },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  style,
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {label && (
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--text-2)",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {label}
        </span>
      )}
      {children}
      {hint && <span style={{ fontSize: 12, color: "var(--text-3)" }}>{hint}</span>}
    </label>
  );
}

const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "13px 15px",
  borderRadius: "var(--radius-sm)",
  border: "1.5px solid var(--border)",
  background: "var(--surface-2)",
  fontSize: 15,
  color: "var(--text)",
  outline: "none",
};

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput(props, ref) {
    return <input ref={ref} {...props} style={{ ...inputBase, ...(props.style || {}) }} />;
  },
);

type SelectOption = string | { value: string; label: string };

export function Select({
  value,
  onChange,
  options,
  placeholder,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputBase, ...style }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ),
      )}
    </select>
  );
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: 999, padding: 4, gap: 2 }}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          style={{
            flex: 1,
            border: "none",
            borderRadius: 999,
            padding: "10px 8px",
            fontSize: 13,
            fontWeight: 700,
            background: value === o.value ? "var(--surface)" : "transparent",
            color: value === o.value ? "var(--primary-dark)" : "var(--text-2)",
            boxShadow: value === o.value ? "var(--shadow)" : "none",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export type BadgeTone = "primary" | "good" | "warn" | "danger" | "neutral";

export function Badge({ children, tone = "primary" }: { children: React.ReactNode; tone?: BadgeTone }) {
  const tones: Record<BadgeTone, { bg: string; fg: string }> = {
    primary: { bg: "var(--primary-tint)", fg: "var(--primary-dark)" },
    good: { bg: "var(--good-tint)", fg: "var(--good)" },
    warn: { bg: "var(--warn-tint)", fg: "oklch(45% 0.13 75)" },
    danger: { bg: "var(--danger-tint)", fg: "var(--danger)" },
    neutral: { bg: "var(--surface-2)", fg: "var(--text-2)" },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        background: t.bg,
        color: t.fg,
        fontSize: 11.5,
        fontWeight: 800,
        padding: "4px 11px",
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </span>
  );
}

const CHIP_LETTERS: Record<string, string> = { primary: "R", good: "S", warn: "C", neutral: "•" };

export function StatTile({
  label,
  value,
  unit,
  tone = "primary",
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  tone?: "primary" | "good" | "neutral";
}) {
  const colorVar = tone === "neutral" ? "var(--text-2)" : `var(--${tone})`;
  const tintVar = tone === "neutral" ? "var(--surface-2)" : `var(--${tone}-tint)`;
  return (
    <div
      style={{
        flex: 1,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "14px 10px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          background: tintVar,
          color: colorVar,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 800,
          fontFamily: "var(--font-display)",
        }}
      >
        {CHIP_LETTERS[tone] || "•"}
      </div>
      <div className="num" style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>
        {value}
        <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2, color: "var(--text-3)" }}>{unit}</span>
      </div>
      <div
        style={{
          fontSize: 10.5,
          color: "var(--text-3)",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: "flex", gap: 6, padding: "0 20px 16px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{ flex: 1, height: 4, borderRadius: 4, background: i <= current ? "var(--primary)" : "var(--border)" }}
        />
      ))}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "oklch(20% 0.01 255 / 0.55)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg)",
          borderRadius: "26px 26px 0 0",
          padding: 22,
          width: "100%",
          maxWidth: 480,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700 }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "var(--surface-2)",
              borderRadius: 999,
              width: 32,
              height: 32,
              fontSize: 17,
              color: "var(--text-2)",
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
