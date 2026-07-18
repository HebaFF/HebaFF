window.STRINGS = {
  en: {
    tabCalculator: "Calculator", tabHistory: "History", tabPremium: "Premium", tabProfile: "Profile",
    login: "Log in", signup: "Sign up", appTagline: "Personalized carb ratio and insulin dose calculator.",
    language: "Language",
  },
  ar: {
    tabCalculator: "الحاسبة", tabHistory: "السجل", tabPremium: "بريميوم", tabProfile: "الملف الشخصي",
    login: "تسجيل الدخول", signup: "حساب جديد", appTagline: "حاسبة معامل الكارب وحساسية الأنسولين الخاصة بك.",
    language: "اللغة",
  },
};

// Rapid/mealtime insulin brand names
window.RAPID_INSULINS = [
  "NovoRapid (Aspart)", "Apidra (Glulisine)", "Humalog (Lispro)",
  "Fiasp", "Actrapid (Regular/Short-acting)", "Other rapid/short-acting"
];

// Basal/long-acting insulin brand names
window.BASAL_INSULINS = [
  "Lantus (Glargine)", "Levemir (Detemir)", "Tresiba (Degludec)",
  "Toujeo", "Basaglar", "Insulatard (NPH)", "Other basal/long-acting"
];

// Oral medications (type 2 / pre-diabetes)
window.PILL_OPTIONS = [
  "Metformin", "Glimepiride", "Gliclazide", "Sitagliptin", "Empagliflozin",
  "Dapagliflozin", "Pioglitazone", "Repaglinide", "Acarbose", "Other pill"
];

window.DIABETES_TYPES = [
  { id: "type1", label: "Type 1" },
  { id: "type2", label: "Type 2" },
  { id: "gestational", label: "Gestational" },
  { id: "other", label: "Other / LADA / MODY" }
];

// Food database — name, category, portion label, carbs (g) per that portion
window.FOOD_DB = [
  // Grains & Bread
  { name: "White rice, cooked", category: "Grains & Bread", portion: "1 cup (158g)", carbs: 45 },
  { name: "Brown rice, cooked", category: "Grains & Bread", portion: "1 cup (195g)", carbs: 45 },
  { name: "Koshari (rice, lentils, pasta)", category: "Grains & Bread", portion: "1 plate (300g)", carbs: 78 },
  { name: "Pita bread (white)", category: "Grains & Bread", portion: "1 piece (60g)", carbs: 33 },
  { name: "Pita bread (whole wheat)", category: "Grains & Bread", portion: "1 piece (60g)", carbs: 28 },
  { name: "Baguette", category: "Grains & Bread", portion: "1 slice (30g)", carbs: 15 },
  { name: "White sandwich bread", category: "Grains & Bread", portion: "1 slice (28g)", carbs: 14 },
  { name: "Whole wheat bread", category: "Grains & Bread", portion: "1 slice (28g)", carbs: 12 },
  { name: "Spaghetti, cooked", category: "Grains & Bread", portion: "1 cup (140g)", carbs: 43 },
  { name: "Macaroni & cheese", category: "Grains & Bread", portion: "1 cup (200g)", carbs: 40 },
  { name: "Couscous, cooked", category: "Grains & Bread", portion: "1 cup (157g)", carbs: 36 },
  { name: "Freekeh, cooked", category: "Grains & Bread", portion: "1 cup (170g)", carbs: 40 },
  { name: "Oatmeal, cooked", category: "Grains & Bread", portion: "1 cup (234g)", carbs: 27 },
  { name: "Corn flakes", category: "Grains & Bread", portion: "1 cup (28g)", carbs: 24 },
  { name: "Pancake", category: "Grains & Bread", portion: "1 medium (60g)", carbs: 22 },
  { name: "Waffle", category: "Grains & Bread", portion: "1 medium (75g)", carbs: 25 },
  { name: "Croissant", category: "Grains & Bread", portion: "1 medium (57g)", carbs: 26 },
  { name: "Bagel, plain", category: "Grains & Bread", portion: "1 medium (89g)", carbs: 48 },
  { name: "Tortilla, flour", category: "Grains & Bread", portion: "1 medium (45g)", carbs: 24 },
  { name: "Crackers, saltine", category: "Grains & Bread", portion: "5 crackers (15g)", carbs: 10 },

  // Legumes
  { name: "Ful medames (fava beans)", category: "Legumes", portion: "1 cup (170g)", carbs: 32 },
  { name: "Lentil soup", category: "Legumes", portion: "1 cup (240g)", carbs: 20 },
  { name: "Chickpeas, cooked", category: "Legumes", portion: "1 cup (164g)", carbs: 45 },
  { name: "Hummus", category: "Legumes", portion: "1/4 cup (60g)", carbs: 8 },
  { name: "Falafel", category: "Legumes", portion: "3 pieces (75g)", carbs: 18 },
  { name: "Black beans, cooked", category: "Legumes", portion: "1 cup (172g)", carbs: 41 },
  { name: "Red kidney beans, cooked", category: "Legumes", portion: "1 cup (177g)", carbs: 40 },
  { name: "Green peas, cooked", category: "Legumes", portion: "1 cup (160g)", carbs: 25 },

  // Vegetables
  { name: "Mixed vegetable stew (with meat)", category: "Vegetables", portion: "1 plate (250g)", carbs: 15 },
  { name: "Mahshi (stuffed vegetables)", category: "Vegetables", portion: "2 pieces (200g)", carbs: 22 },
  { name: "Potato, boiled", category: "Vegetables", portion: "1 medium (150g)", carbs: 30 },
  { name: "French fries", category: "Vegetables", portion: "1 medium serving (117g)", carbs: 43 },
  { name: "Sweet potato, baked", category: "Vegetables", portion: "1 medium (130g)", carbs: 24 },
  { name: "Corn, boiled", category: "Vegetables", portion: "1 ear (90g)", carbs: 19 },
  { name: "Carrots, cooked", category: "Vegetables", portion: "1 cup (156g)", carbs: 12 },
  { name: "Tomato salad", category: "Vegetables", portion: "1 cup (180g)", carbs: 7 },
  { name: "Green salad (leafy, mixed)", category: "Vegetables", portion: "1 bowl (100g)", carbs: 4 },
  { name: "Okra stew (bamya)", category: "Vegetables", portion: "1 cup (200g)", carbs: 10 },
  { name: "Molokhia", category: "Vegetables", portion: "1 cup (200g)", carbs: 8 },
  { name: "Onion, raw", category: "Vegetables", portion: "1/2 cup chopped (58g)", carbs: 6 },

  // Fruits
  { name: "Apple", category: "Fruits", portion: "1 medium (182g)", carbs: 25 },
  { name: "Banana", category: "Fruits", portion: "1 medium (118g)", carbs: 27 },
  { name: "Orange", category: "Fruits", portion: "1 medium (131g)", carbs: 15 },
  { name: "Mango", category: "Fruits", portion: "1 cup sliced (165g)", carbs: 25 },
  { name: "Grapes", category: "Fruits", portion: "1 cup (92g)", carbs: 16 },
  { name: "Watermelon", category: "Fruits", portion: "1 cup diced (152g)", carbs: 11 },
  { name: "Dates", category: "Fruits", portion: "3 dates (24g)", carbs: 18 },
  { name: "Strawberries", category: "Fruits", portion: "1 cup (152g)", carbs: 11 },
  { name: "Pineapple", category: "Fruits", portion: "1 cup (165g)", carbs: 22 },
  { name: "Guava", category: "Fruits", portion: "1 medium (55g)", carbs: 8 },
  { name: "Fig, dried", category: "Fruits", portion: "2 figs (38g)", carbs: 24 },
  { name: "Raisins", category: "Fruits", portion: "1/4 cup (36g)", carbs: 29 },
  { name: "Pear", category: "Fruits", portion: "1 medium (178g)", carbs: 27 },
  { name: "Peach", category: "Fruits", portion: "1 medium (150g)", carbs: 14 },

  // Dairy
  { name: "Milk, whole", category: "Dairy", portion: "1 cup (244g)", carbs: 12 },
  { name: "Milk, skim", category: "Dairy", portion: "1 cup (245g)", carbs: 12 },
  { name: "Yogurt, plain", category: "Dairy", portion: "1 cup (245g)", carbs: 17 },
  { name: "Yogurt, flavored", category: "Dairy", portion: "1 cup (245g)", carbs: 32 },
  { name: "Rice pudding (roz bel laban)", category: "Dairy", portion: "1 bowl (150g)", carbs: 30 },
  { name: "Ice cream", category: "Dairy", portion: "1/2 cup (66g)", carbs: 16 },
  { name: "Cheese, white (feta-style)", category: "Dairy", portion: "1 oz (28g)", carbs: 1 },
  { name: "Cream cheese", category: "Dairy", portion: "1 tbsp (15g)", carbs: 1 },
  { name: "Labneh", category: "Dairy", portion: "1/4 cup (60g)", carbs: 3 },

  // Meat, poultry, fish (low-carb, included for meal completeness)
  { name: "Grilled chicken breast", category: "Meat & Fish", portion: "100g", carbs: 0 },
  { name: "Kofta (grilled)", category: "Meat & Fish", portion: "3 pieces (150g)", carbs: 3 },
  { name: "Beef steak", category: "Meat & Fish", portion: "100g", carbs: 0 },
  { name: "Fried fish", category: "Meat & Fish", portion: "1 fillet (120g)", carbs: 8 },
  { name: "Grilled shrimp", category: "Meat & Fish", portion: "100g", carbs: 1 },
  { name: "Egg, boiled", category: "Meat & Fish", portion: "1 large", carbs: 1 },
  { name: "Sausage/hot dog", category: "Meat & Fish", portion: "1 link (50g)", carbs: 2 },

  // Fast food & mixed dishes
  { name: "Shawarma sandwich", category: "Fast Food", portion: "1 sandwich (250g)", carbs: 40 },
  { name: "Beef burger with bun", category: "Fast Food", portion: "1 burger (220g)", carbs: 35 },
  { name: "Cheese pizza", category: "Fast Food", portion: "1 slice (107g)", carbs: 30 },
  { name: "Chicken shawarma plate", category: "Fast Food", portion: "1 plate (350g)", carbs: 55 },
  { name: "Fried chicken (2 pieces)", category: "Fast Food", portion: "2 pieces (180g)", carbs: 18 },
  { name: "Hawawshi", category: "Fast Food", portion: "1 piece (200g)", carbs: 38 },
  { name: "Feteer meshaltet (sweet)", category: "Fast Food", portion: "1 slice (150g)", carbs: 55 },
  { name: "Kabsa (rice & meat)", category: "Fast Food", portion: "1 plate (350g)", carbs: 70 },
  { name: "Fattah", category: "Fast Food", portion: "1 plate (300g)", carbs: 60 },

  // Snacks & Sweets
  { name: "Baklava", category: "Snacks & Sweets", portion: "1 piece (40g)", carbs: 22 },
  { name: "Basbousa", category: "Snacks & Sweets", portion: "1 piece (60g)", carbs: 35 },
  { name: "Kunafa", category: "Snacks & Sweets", portion: "1 slice (100g)", carbs: 50 },
  { name: "Chocolate bar (milk)", category: "Snacks & Sweets", portion: "1 bar (44g)", carbs: 26 },
  { name: "Cookies (plain)", category: "Snacks & Sweets", portion: "3 cookies (30g)", carbs: 21 },
  { name: "Potato chips", category: "Snacks & Sweets", portion: "1 small bag (28g)", carbs: 15 },
  { name: "Popcorn", category: "Snacks & Sweets", portion: "1 cup popped (8g)", carbs: 6 },
  { name: "Honey", category: "Snacks & Sweets", portion: "1 tbsp (21g)", carbs: 17 },
  { name: "Sugar, white", category: "Snacks & Sweets", portion: "1 tsp (4g)", carbs: 4 },
  { name: "Jam/marmalade", category: "Snacks & Sweets", portion: "1 tbsp (20g)", carbs: 13 },
  { name: "Granola bar", category: "Snacks & Sweets", portion: "1 bar (35g)", carbs: 22 },
  { name: "Donut, glazed", category: "Snacks & Sweets", portion: "1 medium (60g)", carbs: 34 },

  // Nuts & Seeds (mostly low-carb)
  { name: "Almonds", category: "Nuts & Seeds", portion: "1 oz / 23 nuts (28g)", carbs: 6 },
  { name: "Peanuts", category: "Nuts & Seeds", portion: "1 oz (28g)", carbs: 5 },
  { name: "Cashews", category: "Nuts & Seeds", portion: "1 oz (28g)", carbs: 9 },
  { name: "Peanut butter", category: "Nuts & Seeds", portion: "2 tbsp (32g)", carbs: 7 },

  // Beverages
  { name: "Orange juice", category: "Beverages", portion: "1 cup (248g)", carbs: 26 },
  { name: "Apple juice", category: "Beverages", portion: "1 cup (248g)", carbs: 28 },
  { name: "Cola (regular)", category: "Beverages", portion: "1 can (355ml)", carbs: 39 },
  { name: "Sports drink", category: "Beverages", portion: "1 bottle (500ml)", carbs: 34 },
  { name: "Sugarcane juice", category: "Beverages", portion: "1 cup (240ml)", carbs: 30 },
  { name: "Karkade (hibiscus tea, sweetened)", category: "Beverages", portion: "1 cup (240ml)", carbs: 20 },
  { name: "Tea, unsweetened", category: "Beverages", portion: "1 cup (240ml)", carbs: 0 },
  { name: "Coffee, black", category: "Beverages", portion: "1 cup (240ml)", carbs: 0 },
  { name: "Glucose tablets", category: "Beverages", portion: "3 tablets (12g)", carbs: 12 },
  { name: "Diet soda", category: "Beverages", portion: "1 can (355ml)", carbs: 0 }
];

// ---- Calculation helpers (450/500 & 1800/1500 rules) ----
// tdd = total daily dose of insulin (rapid + basal units/day)
window.calcCarbRatio = function (tdd) {
  return 500 / tdd; // grams of carb covered by 1 unit of rapid insulin
};
window.calcISF = function (rapidUnits, basalUnits) {
  const tdd = rapidUnits + basalUnits;
  const ratio = basalUnits / rapidUnits;
  const numerator = ratio === 1 ? 1700 : ratio < 1 ? 1500 : ratio > 1 ? 2000 : null;
  return numerator / tdd;
};
// mg/dL that 1g of carb raises blood glucose = ISF / carbRatio
window.calcCarbRise = function (isf, carbRatio) {
  return isf / carbRatio;
};

window.round2 = function (n) {
  return Math.round(n * 100) / 100;
};

window.MGDL_TO_MMOL = 1 / 18.0182;
window.convertBG = function (value, toUnit) {
  // value assumed stored in mg/dL internally; convert for display
  if (toUnit === "mmol") return window.round2(value * window.MGDL_TO_MMOL);
  return Math.round(value);
};

// Classify a displayed BG value (in the user's chosen units) into low/inRange/high
window.classifyBG = function (value, units) {
  const mgdl = units === "mmol" ? Number(value) * 18.0182 : Number(value);
  if (!mgdl) return null;
  if (mgdl < 70) return "low";
  if (mgdl > 180) return "high";
  return "inRange";
};
