"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { AppShell } from "@/components/ui";

export default function Home() {
  const { user, loading } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!user.profile) router.replace("/onboarding");
    else router.replace("/home");
  }, [loading, user, router]);

  return (
    <AppShell>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--text-3)", fontSize: 13 }}>{t.common.loading}</span>
      </div>
    </AppShell>
  );
}
