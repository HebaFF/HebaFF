"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, TopNav } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { AppDataProvider } from "@/context/AppDataContext";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "setup", label: "Setup" },
  { id: "history", label: "History" },
  { id: "premium", label: "Premium" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = TABS.find((t) => pathname.startsWith(`/${t.id}`))?.id ?? "dashboard";

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
          age={user.profile.age}
          tab={activeTab}
          onChange={(id) => router.push(`/${id}`)}
          tabs={TABS}
        />
        {children}
      </AppShell>
    </AppDataProvider>
  );
}
