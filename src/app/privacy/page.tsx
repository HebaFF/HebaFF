"use client";

import { useRouter } from "next/navigation";
import { AppShell, TopBar } from "@/components/ui";
import { useLang } from "@/context/LangContext";

export default function PrivacyPolicyPage() {
  const { t } = useLang();
  const T = t.privacy;
  const router = useRouter();

  return (
    <AppShell>
      <TopBar title={T.title} onBack={() => router.back()} />
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{T.lastUpdated}</div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6 }}>{T.operatedBy}</div>
        {T.sections.map((s) => (
          <div key={s.heading} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{s.heading}</div>
            <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.7 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
