export const RAPID_INSULINS = [
  "NovoRapid (Aspart)",
  "Apidra (Glulisine)",
  "Humalog (Lispro)",
  "Fiasp",
  "Actrapid (Regular/Short-acting)",
  "Other rapid/short-acting",
];

export const BASAL_INSULINS = [
  "Lantus (Glargine)",
  "Levemir (Detemir)",
  "Tresiba (Degludec)",
  "Toujeo",
  "Basaglar",
  "Insulatard (NPH)",
  "Other basal/long-acting",
];

export const PILL_OPTIONS = [
  "Metformin",
  "Glimepiride",
  "Gliclazide",
  "Sitagliptin",
  "Empagliflozin",
  "Dapagliflozin",
  "Pioglitazone",
  "Repaglinide",
  "Acarbose",
  "Other pill",
];

export const DIABETES_TYPES = [
  { id: "type1", label: "Type 1" },
  { id: "type2", label: "Type 2" },
  { id: "gestational", label: "Gestational" },
  { id: "other", label: "Other / LADA / MODY" },
] as const;

export const STRINGS = {
  en: {
    tabCalculator: "Calculator",
    tabHistory: "History",
    tabPremium: "Premium",
    tabProfile: "Profile",
    login: "Log in",
    signup: "Sign up",
    appTagline: "Personalized carb ratio and insulin dose calculator.",
    language: "Language",
  },
  ar: {
    tabCalculator: "الحاسبة",
    tabHistory: "السجل",
    tabPremium: "بريميوم",
    tabProfile: "الملف الشخصي",
    login: "تسجيل الدخول",
    signup: "حساب جديد",
    appTagline: "حاسبة معامل الكارب وحساسية الأنسولين الخاصة بك.",
    language: "اللغة",
  },
} as const;

export type Lang = keyof typeof STRINGS;

export const ONE_TIME_PRICE_DISPLAY = "$29.99";
export const TRIAL_DAYS = 7;

export const PREMIUM_FEATURES = [
  "Full searchable food database, unlimited history",
  "Export history as CSV for your doctor",
  "Trend insights across meals & glucose readings",
  "Multiple insulin/pill regimen profiles",
];
