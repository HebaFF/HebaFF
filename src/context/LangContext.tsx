"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { STRINGS, type Lang } from "@/lib/constants";

type StringsShape = { [K in keyof (typeof STRINGS)["en"]]: string };

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  strings: StringsShape;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("glucodose_lang") as Lang | null;
    if (stored === "en" || stored === "ar") setLangState(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem("glucodose_lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang: setLangState, strings: STRINGS[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
