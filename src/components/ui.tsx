"use client";

// Shared UI primitives — ported 1:1 from design_handoff_glucodose/components.jsx.
// Keep styling pixel-for-pixel; this is the single source of design truth.
import React from "react";
import { SettingsIcon, CrownIcon, PlusIcon } from "@/components/icons";

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
  backLabel = "Back",
  right,
}: {
  title: string;
  onBack?: () => void;
  backLabel?: string;
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
          aria-label={backLabel}
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
          <svg width="16" height="16" viewBox="0 0 16 16" className="back-chevron">
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

export function TopNav({
  name,
  subtitle,
  isPremium,
  onHome,
  onSetup,
  onPremium,
  homeLabel,
  setupLabel,
  proLabel,
  freeLabel,
}: {
  name?: string;
  subtitle?: string;
  isPremium: boolean;
  onHome: () => void;
  onSetup: () => void;
  onPremium: () => void;
  homeLabel: string;
  setupLabel: string;
  proLabel: string;
  freeLabel: string;
}) {
  const initial = (name?.trim()?.[0] ?? "G").toUpperCase();
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 5, background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
      <div style={{ padding: "16px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <button
          onClick={onHome}
          aria-label={homeLabel}
          style={{ display: "flex", alignItems: "center", gap: 10, border: "none", background: "none", padding: 0, textAlign: "left", minWidth: 0 }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              background: "var(--primary-tint)",
              color: "var(--primary-dark)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {initial}
          </span>
          <span style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 16.5,
                fontWeight: 800,
                color: "var(--text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name || "GlucoDose"}
            </div>
            {subtitle && (
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {subtitle}
              </div>
            )}
          </span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button
            onClick={onPremium}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              border: "none",
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 800,
              background: isPremium ? "var(--warn-tint)" : "var(--surface-2)",
              color: isPremium ? "var(--warn)" : "var(--text-2)",
              flexShrink: 0,
            }}
          >
            <CrownIcon size={13} />
            {isPremium ? proLabel : freeLabel}
          </button>
          <button
            onClick={onSetup}
            aria-label={setupLabel}
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: "none",
              background: "var(--surface-2)",
              color: "var(--text-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <SettingsIcon size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function BottomNav({
  tab,
  onChange,
  tabs,
}: {
  tab: string;
  onChange: (id: string) => void;
  tabs: { id: string; icon: (props: { size?: number; color?: string }) => React.ReactNode; label: string }[];
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        zIndex: 6,
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        padding: "8px 10px calc(8px + env(safe-area-inset-bottom, 0px))",
        gap: 4,
      }}
    >
      {tabs.map((t) => {
        const active = tab === t.id;
        const color = active ? "var(--primary)" : "var(--text-3)";
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              border: "none",
              background: "none",
              padding: "8px 4px",
            }}
          >
            <t.icon size={21} color={color} />
            <span style={{ fontSize: 11, fontWeight: 700, color }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function FAB({ icon, label, onClick }: { icon?: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(74px + env(safe-area-inset-bottom, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        display: "flex",
        justifyContent: "flex-end",
        padding: "0 20px",
        pointerEvents: "none",
        zIndex: 6,
      }}
    >
      <button
        onClick={onClick}
        aria-label={label}
        style={{
          pointerEvents: "auto",
          width: 56,
          height: 56,
          borderRadius: 999,
          border: "none",
          background: "var(--primary)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px oklch(0% 0 0 / 0.18)",
        }}
      >
        {icon ?? <PlusIcon size={26} strokeWidth={2.6} />}
      </button>
    </div>
  );
}

export type CardTone = "primary" | "good" | "warn" | "danger" | "indigo" | "sky" | "surface" | "neutral";

export const TONE_TINT: Record<CardTone, string> = {
  primary: "var(--primary-tint)",
  good: "var(--good-tint)",
  warn: "var(--warn-tint)",
  danger: "var(--danger-tint)",
  indigo: "var(--indigo-tint)",
  sky: "var(--sky-tint)",
  surface: "var(--surface)",
  neutral: "var(--surface-2)",
};

export const TONE_ICON_COLOR: Record<CardTone, string> = {
  primary: "var(--primary-dark)",
  good: "var(--good)",
  warn: "var(--warn)",
  danger: "var(--danger)",
  indigo: "var(--indigo)",
  sky: "var(--sky)",
  surface: "var(--text-2)",
  neutral: "var(--text-2)",
};

export function DashboardCard({
  icon,
  title,
  right,
  children,
  style,
  tone = "primary",
  tinted = false,
}: {
  icon?: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  tone?: CardTone;
  tinted?: boolean;
}) {
  const cardBg = tinted ? { background: TONE_TINT[tone], border: "none" } : {};
  const chipBg = tinted ? "var(--surface)" : TONE_TINT[tone];
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 14, ...cardBg, ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon && (
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,
                background: chipBg,
                color: TONE_ICON_COLOR[tone],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          )}
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
  value,
  unit,
  status,
  color = "var(--good)",
  size = 148,
  spectrum = false,
}: {
  pct: number;
  value: React.ReactNode;
  unit?: string;
  status?: string;
  color?: string;
  size?: number;
  spectrum?: boolean;
}) {
  const deg = Math.max(0, Math.min(100, pct)) * 3.6;
  const inner = size - 32;
  const seg1 = (deg / 3).toFixed(1);
  const seg2 = ((deg * 2) / 3).toFixed(1);
  const background = spectrum
    ? `conic-gradient(from -90deg, var(--good) 0deg ${seg1}deg, var(--warn) ${seg1}deg ${seg2}deg, var(--danger) ${seg2}deg ${deg}deg, var(--border) ${deg}deg 360deg)`
    : `conic-gradient(${color} ${deg}deg, var(--border) ${deg}deg 360deg)`;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "999px",
        margin: "0 auto",
        background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: inner,
          height: inner,
          borderRadius: 999,
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <div className="num" style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>
          {value}
        </div>
        {unit && <div style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 600 }}>{unit}</div>}
        {status && (
          <div style={{ fontSize: 11.5, fontWeight: 700, color, marginTop: 4, textAlign: "center" }}>{status}</div>
        )}
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

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea(props, ref) {
    return (
      <textarea
        ref={ref}
        {...props}
        style={{ ...inputBase, resize: "vertical", minHeight: 90, fontFamily: "inherit", ...(props.style || {}) }}
      />
    );
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
    warn: { bg: "var(--warn-tint)", fg: "var(--warn)" },
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

export function StatTile({
  icon,
  label,
  value,
  unit,
  tone = "primary",
  tinted = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit?: string;
  tone?: CardTone;
  tinted?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: tinted ? TONE_TINT[tone] : "var(--surface)",
        border: tinted ? "none" : "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "14px 10px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      {icon && (
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            background: tinted ? "var(--surface)" : TONE_TINT[tone],
            color: TONE_ICON_COLOR[tone],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      )}
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
        <div style={{ width: 40, height: 5, borderRadius: 999, background: "var(--border)", margin: "0 auto 16px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700 }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "var(--primary-tint)",
              borderRadius: 999,
              width: 32,
              height: 32,
              fontSize: 17,
              fontWeight: 700,
              color: "var(--primary-dark)",
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
