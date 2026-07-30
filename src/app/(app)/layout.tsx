"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, TopNav, BottomNav } from "@/components/ui";
import { HomeIcon, TrendUpIcon, CalculatorIcon, ListIcon, HeartIcon, type IconProps } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { AppDataProvider } from "@/context/AppDataContext";
import { useLang } from "@/context/LangContext";
import { diabetesTypesFor } from "@/lib/constants";

const BOTTOM_TAB_IDS = ["home", "overview", "calculator", "history", "care"] as const;
const BOTTOM_TAB_ICONS: Record<(typeof BOTTOM_TAB_IDS)[number], (props: IconProps) => React.ReactNode> = {
  home: HomeIcon,
  overview: TrendUpIcon,
  calculator: CalculatorIcon,
  history: ListIcon,
  care: HeartIcon,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useLang();
  const bottomTabs = BOTTOM_TAB_IDS.map((id) => ({ id, icon: BOTTOM_TAB_ICONS[id], label: t.nav[id] }));
  const activeBottomTab = bottomTabs.find((tb) => pathname.startsWith(`/${tb.id}`))?.id ?? "";

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!user.profile) router.replace("/onboarding");
  }, [loading, user, router]);

  if (loading || !user || !user.profile) return null;

  const typeLabel = diabetesTypesFor(lang).find((dt) => dt.id === user.profile!.diabetesType)?.label;
  const subtitle = [user.profile.age ? t.nav.age(user.profile.age) : null, typeLabel].filter(Boolean).join(" · ");

  return (
    <AppDataProvider>
      <AppShell>
        <TopNav
          name={user.profile.name}
          subtitle={subtitle || undefined}
          isPremium={user.subscription.isPremium}
          onHome={() => router.push("/home")}
          onSetup={() => router.push("/setup")}
          onPremium={() => router.push("/premium")}
          homeLabel={t.nav.home}
          setupLabel={t.nav.setup}
          proLabel={t.nav.pro}
          freeLabel={t.nav.free}
          lang={lang}
          onChangeLang={setLang}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>{children}</div>
        <BottomNav tab={activeBottomTab} onChange={(id) => router.push(`/${id}`)} tabs={bottomTabs} />
      </AppShell>
    </AppDataProvider>
  );
}
