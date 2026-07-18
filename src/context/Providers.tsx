"use client";

import { AuthProvider } from "./AuthContext";
import { LangProvider } from "./LangContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <AuthProvider>{children}</AuthProvider>
    </LangProvider>
  );
}
