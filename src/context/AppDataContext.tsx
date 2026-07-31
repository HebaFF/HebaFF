"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, type Food, type LogEntry } from "@/lib/api";

type AppDataContextValue = {
  entries: LogEntry[];
  foods: Food[];
  loading: boolean;
  logEntry: (entry: Omit<LogEntry, "id">) => Promise<void>;
  updateEntry: (id: string, patch: Partial<Omit<LogEntry, "id" | "type">>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addCustomFood: (food: { name: string; portion: string; carbs: number; category?: string }) => Promise<void>;
  refresh: () => Promise<void>;
};

function byTimestampDesc(a: LogEntry, b: LogEntry) {
  return b.timestamp - a.timestamp;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [e, f] = await Promise.all([api.listEntries(), api.listFoods()]);
    setEntries(e.entries);
    setFoods(f.foods);
  }, []);

  // One-time entries/foods hydration on mount. See AuthContext.tsx for why
  // this fetch-on-mount pattern (with an unmount guard) is kept as-is rather
  // than restructured around react-hooks/set-state-in-effect.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const logEntry = useCallback(async (entry: Omit<LogEntry, "id">) => {
    const { entry: saved } = await api.addEntry(entry);
    setEntries((prev) => [...prev, saved].sort(byTimestampDesc));
  }, []);

  const updateEntry = useCallback(async (id: string, patch: Partial<Omit<LogEntry, "id" | "type">>) => {
    const { entry: saved } = await api.updateEntry(id, patch);
    setEntries((prev) => prev.map((e) => (e.id === id ? saved : e)).sort(byTimestampDesc));
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    await api.deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addCustomFood = useCallback(
    async (food: { name: string; portion: string; carbs: number; category?: string }) => {
      const { food: saved } = await api.addFood(food);
      setFoods((prev) => [saved, ...prev]);
    },
    [],
  );

  return (
    <AppDataContext.Provider
      value={{ entries, foods, loading, logEntry, updateEntry, deleteEntry, addCustomFood, refresh }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
