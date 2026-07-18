"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, type Food, type LogEntry } from "@/lib/api";

type AppDataContextValue = {
  entries: LogEntry[];
  foods: Food[];
  loading: boolean;
  logEntry: (entry: Omit<LogEntry, "id">) => Promise<void>;
  addCustomFood: (food: { name: string; portion: string; carbs: number; category?: string }) => Promise<void>;
  refresh: () => Promise<void>;
};

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

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const logEntry = useCallback(async (entry: Omit<LogEntry, "id">) => {
    const { entry: saved } = await api.addEntry(entry);
    setEntries((prev) => [saved, ...prev]);
  }, []);

  const addCustomFood = useCallback(
    async (food: { name: string; portion: string; carbs: number; category?: string }) => {
      const { food: saved } = await api.addFood(food);
      setFoods((prev) => [saved, ...prev]);
    },
    [],
  );

  return (
    <AppDataContext.Provider value={{ entries, foods, loading, logEntry, addCustomFood, refresh }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
