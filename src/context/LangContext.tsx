"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { STRINGS, type Lang } from "@/lib/constants";

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (typeof STRINGS)["en"];
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // One-time read of the persisted language preference on mount. See
  // AuthContext.tsx for why this pattern is kept as-is rather than
  // restructured around react-hooks/set-state-in-effect.
  useEffect(() => {
    const stored = localStorage.getItem("glucodose_lang") as Lang | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "en" || stored === "ar") setLangState(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem("glucodose_lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang: setLangState, t: STRINGS[lang] }}>{children}</LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
