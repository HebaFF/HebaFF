"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, TopNav, BottomNav } from "@/components/ui";
import { HomeIcon, PulseIcon, CalculatorIcon, ChartIcon, HeartIcon, type IconProps } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { AppDataProvider } from "@/context/AppDataContext";
import { useLang } from "@/context/LangContext";

const BOTTOM_TAB_IDS = ["home", "overview", "calculator", "analytics", "care"] as const;
const BOTTOM_TAB_ICONS: Record<(typeof BOTTOM_TAB_IDS)[number], (props: IconProps) => React.ReactNode> = {
  home: HomeIcon,
  overview: PulseIcon,
  calculator: CalculatorIcon,
  analytics: ChartIcon,
  care: HeartIcon,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLang();
  const bottomTabs = BOTTOM_TAB_IDS.map((id) => ({ id, icon: BOTTOM_TAB_ICONS[id], label: t.nav[id] }));
  const activeBottomTab = bottomTabs.find((tb) => pathname.startsWith(`/${tb.id}`))?.id ?? "";

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
          onHome={() => router.push("/home")}
          onSetup={() => router.push("/setup")}
          onPremium={() => router.push("/premium")}
          homeLabel={t.nav.home}
          setupLabel={t.nav.setup}
          premiumLabel={t.nav.premium}
        />
        {children}
        <BottomNav tab={activeBottomTab} onChange={(id) => router.push(`/${id}`)} tabs={bottomTabs} />
      </AppShell>
    </AppDataProvider>
  );
}
