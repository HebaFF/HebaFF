"use client";

import { AppShell, TopBar } from "@/components/ui";
import { useLang } from "@/context/LangContext";

export default function SupportPage() {
  const { t } = useLang();
  const T = t.support;

  return (
    <AppShell>
      <TopBar title={T.title} />
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>{T.intro}</div>
        <div
          style={{
            background: "var(--primary-tint)",
            borderRadius: 16,
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700 }}>{T.contactHeading}</div>
          <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>{T.contactBody}</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{T.faqHeading}</div>
        {T.faq.map((item) => (
          <div key={item.q} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{item.q}</div>
            <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.7 }}>{item.a}</div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
