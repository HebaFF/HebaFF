"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, TopNav } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { AppDataProvider } from "@/context/AppDataContext";
import { useLang } from "@/context/LangContext";

const TAB_IDS = ["dashboard", "setup", "history", "premium"] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLang();
  const tabs = TAB_IDS.map((id) => ({ id, label: t.nav[id] }));
  const activeTab = tabs.find((tb) => pathname.startsWith(`/${tb.id}`))?.id ?? "dashboard";

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!user.profile) router.replace("/onboarding");
  }, [loading, user, router]);

  if (loading || !user || !user.profile) return null;

  return (
    <AppDataProvider>
      <AppShell>
        <TopNav
          name={user.profile.name}
          welcomeText={t.nav.welcomeBack(user.profile.name)}
          ageText={user.profile.age ? t.nav.age(user.profile.age) : undefined}
          tab={activeTab}
          onChange={(id) => router.push(`/${id}`)}
          tabs={tabs}
        />
        {children}
      </AppShell>
    </AppDataProvider>
  );
}
