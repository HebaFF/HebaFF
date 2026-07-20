import type { ProfileDTO } from "./profileDto";

export type MeUser = {
  id: string;
  username: string;
  email: string;
  profile: ProfileDTO | null;
  subscription: { isPremium: boolean; trialUsed: boolean; trialStartedAt: number | null };
};

export type Food = { name: string; category: string; portion: string; carbs: number; custom?: boolean };

export type LogEntry = {
  id: string;
  type: "meal" | "mealCorrection" | "correction" | "hypo" | "bg";
  timestamp: number;
  foods?: { name: string; qty: number; carbs: number }[];
  carbs?: number;
  currentBG?: number;
  targetBG?: number;
  dose?: number;
  carbsNeeded?: number;
};

class ApiError extends Error {}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error ?? "Something went wrong.");
  return body as T;
}

export const api = {
  me: () => request<{ user: MeUser | null }>("/api/auth/me"),
  signup: (username: string, password: string, email: string) =>
    request<{ id: string; username: string; hasProfile: boolean }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, password, email }),
    }),
  login: (username: string, password: string) =>
    request<{ id: string; username: string; hasProfile: boolean }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  forgotPassword: (email: string) =>
    request<{ ok: true; message: string; devResetUrl?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    request<{ ok: true }>("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
  updateEmail: (email: string) =>
    request<{ email: string }>("/api/account/email", { method: "PUT", body: JSON.stringify({ email }) }),
  saveProfile: (data: Record<string, unknown>) =>
    request<{ profile: ProfileDTO }>("/api/profile", { method: "PUT", body: JSON.stringify(data) }),
  listFoods: () => request<{ foods: Food[] }>("/api/foods"),
  addFood: (food: { name: string; portion: string; carbs: number; category?: string }) =>
    request<{ food: Food }>("/api/foods", { method: "POST", body: JSON.stringify(food) }),
  listEntries: () => request<{ entries: LogEntry[] }>("/api/entries"),
  addEntry: (entry: Omit<LogEntry, "id">) =>
    request<{ entry: LogEntry }>("/api/entries", { method: "POST", body: JSON.stringify(entry) }),
  startTrial: () =>
    request<{ isPremium: boolean; trialUsed: boolean; trialStartedAt: number | null }>(
      "/api/subscription/trial",
      { method: "POST" },
    ),
  checkout: () => request<{ url: string }>("/api/subscription/checkout", { method: "POST" }),
};

export { ApiError };
