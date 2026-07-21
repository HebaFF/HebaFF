"use client";

// Line-icon set — flat, stroke-based, single source of truth for all in-app
// iconography. Every icon takes `size` (px) and inherits color from CSS
// `color` unless a `color` prop overrides it, so callers can recolor via
// parent styles (e.g. active/inactive nav state) without new components.
import React from "react";

export type IconProps = { size?: number; color?: string; strokeWidth?: number; style?: React.CSSProperties };

function base(size: number) {
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none" as const };
}

export function HomeIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <path d="M4 11.5 12 4l8 7.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20h3a1 1 0 0 0 1-1v-9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ClipboardIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <rect x="5" y="4.5" width="14" height="16" rx="2.2" stroke={color} strokeWidth={strokeWidth} />
      <path d="M9 4.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function UsersIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <circle cx="9" cy="8" r="3" stroke={color} strokeWidth={strokeWidth} />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M15.5 5.2c1.4.4 2.3 1.6 2.3 3.1 0 1.4-.9 2.6-2.2 3.1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M16.2 14.7c2 .5 3.8 2.3 3.8 5.3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function LightbulbIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <path d="M9 18h6M10 21h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.45.9 1.15.9 1.9V16h5.2v-.2c0-.75.3-1.45.9-1.9A6 6 0 0 0 12 3Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  );
}

export function ShareIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <circle cx="18" cy="6" r="2.4" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="6" cy="12" r="2.4" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="18" cy="18" r="2.4" stroke={color} strokeWidth={strokeWidth} />
      <path d="M8.1 10.8 15.9 7.2M8.1 13.2l7.8 3.6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function SettingsIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
      <path
        d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4M17.8 17.8l-1.4-1.4M7.6 7.6 6.2 6.2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CrownIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <path
        d="M4 18h16l-1.4-8.2-3.9 3-2.7-5.3-2.7 5.3-3.9-3L4 18Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CalendarIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" stroke={color} strokeWidth={strokeWidth} />
      <path d="M4 9.5h16M8 3.5v3M16 3.5v3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function DropIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <path
        d="M12 3c4 5 6.5 8.3 6.5 11.3A6.5 6.5 0 0 1 5.5 14.3C5.5 11.3 8 8 12 3Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlusIcon({ size = 22, color = "currentColor", strokeWidth = 2.4, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function FireIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <path
        d="M12 21c-3.6 0-6.2-2.4-6.2-5.8 0-2.3 1.3-3.7 2.2-5.1.3.9.9 1.6 1.7 1.9-.2-2.7.8-5.3 3-7 0 2 .6 3.4 1.9 4.7 1.6 1.6 3.5 3 3.5 5.5 0 3.4-2.5 5.8-5.9 5.8Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <path
        d="m12 3.5 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TargetIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="12" cy="12" r="4.3" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="12" cy="12" r="1" fill={color} />
    </svg>
  );
}

export function NoteIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <path
        d="M14.5 3.5 19 8l-8.8 8.8-5 1.2 1.2-5 8.1-8.1Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M13 5 17.5 9.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function CalculatorIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <rect x="5.5" y="3" width="13" height="18" rx="2.2" stroke={color} strokeWidth={strokeWidth} />
      <path d="M8 6.5h8v3H8z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M8.2 13.2h.01M12 13.2h.01M15.8 13.2h.01M8.2 16.5h.01M12 16.5h.01M15.8 16.5h.01" stroke={color} strokeWidth={strokeWidth * 1.4} strokeLinecap="round" />
    </svg>
  );
}

export function WarningIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <path d="M12 4 21 19H3L12 4Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M12 10v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="12" cy="16.6" r="1" fill={color} />
    </svg>
  );
}

export function UtensilsIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <path d="M7 3v7c0 1.1.9 2 2 2h0c1.1 0 2-.9 2-2V3M8 12v9M17 3c-1.7 0-3 2-3 5s1.3 5 3 5v8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SyringeIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <path d="M16.8 3.7 20.3 7.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="m9.3 10.7 4-4 4 4-4 4-4-4Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="m13.3 14.7-7.6 7.6M7.2 16.8l1.7 1.7M4 20l1.7 1.7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function PulseIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <path
        d="M3 12h3.5l2-5.5 3.5 11 2.5-8 1.5 2.5H21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChartIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <path d="M4 20V10M10 20V4M16 20v-7M20.5 20H3.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeartIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <path
        d="M12 20.3S4 15.4 4 9.6C4 6.5 6.4 4.5 9 4.5c1.6 0 2.8.8 3 2 .2-1.2 1.4-2 3-2 2.6 0 5 2 5 5.1 0 5.8-8 10.7-8 10.7Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrendUpIcon({ size = 22, color = "currentColor", strokeWidth = 2, style }: IconProps) {
  return (
    <svg {...base(size)} style={style}>
      <path d="M4 16 10 10l4 4 6-7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 6.5h4.5V11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
