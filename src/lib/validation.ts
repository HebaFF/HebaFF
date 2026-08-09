import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(32, "Username must be at most 32 characters.")
  .regex(/^[a-zA-Z0-9_.]+$/, "Username can only contain letters, numbers, underscores and dots.");

export const passwordSchema = z.string().min(8, "Password must be at least 8 characters.");

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");

export const signupSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  email: emailSchema,
});

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const updateEmailSchema = z.object({
  email: emailSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const profileSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    gender: z.enum(["female", "male"]),
    age: z.coerce.number().int().min(1).max(120),
    diagnosisDate: z.string().min(1), // ISO date string
    diabetesType: z.enum(["type1", "type2", "gestational", "other"]),
    units: z.enum(["mgdl", "mmol"]),
    treatmentMode: z.enum(["insulin", "pills", "both"]),
    insulinDelivery: z.enum(["injections", "pump"]).optional(),
    rapidType: z.string().optional(),
    rapidUnits: z.coerce.number().min(0).optional(),
    rapidActionMinutes: z.coerce.number().int().min(30).max(600).optional(),
    basalType: z.string().optional(),
    basalUnits: z.coerce.number().min(0).optional(),
    pills: z.array(z.string()).default([]),
    carbRatioOverridden: z.boolean().default(false),
    manualCarbRatio: z.coerce.number().positive().optional(),
    manualISF: z.coerce.number().positive().optional(),
  })
  .refine((data) => !data.carbRatioOverridden || data.manualCarbRatio !== undefined, {
    message: "Enter the carb ratio your doctor gave you.",
    path: ["manualCarbRatio"],
  })
  .refine((data) => !data.carbRatioOverridden || data.manualISF !== undefined, {
    message: "Enter the ISF your doctor gave you.",
    path: ["manualISF"],
  });

export const customFoodSchema = z.object({
  name: z.string().trim().min(1).max(120),
  portion: z.string().trim().min(1).max(60),
  carbs: z.coerce.number().min(0).max(2000),
  category: z.string().trim().min(1).max(60).default("My Foods"),
});

const foodItemSchema = z.object({
  name: z.string(),
  qty: z.number(),
  carbs: z.number(),
});

export const communityPostSchema = z.object({
  content: z.string().trim().min(1, "Write something before posting.").max(500, "Posts are limited to 500 characters."),
});

export const logEntrySchema = z.object({
  type: z.enum(["meal", "mealCorrection", "correction", "hypo", "bg"]),
  timestamp: z.coerce.number().optional(),
  foods: z.array(foodItemSchema).optional(),
  carbs: z.coerce.number().optional(),
  currentBG: z.coerce.number().optional(),
  targetBG: z.coerce.number().optional(),
  dose: z.coerce.number().optional(),
  carbsNeeded: z.coerce.number().optional(),
  notes: z.string().trim().max(280).optional(),
});

export const updateEntrySchema = logEntrySchema.omit({ type: true }).partial();

export const verifyPlayPurchaseSchema = z.object({
  purchaseToken: z.string().min(1),
  productId: z.string().min(1),
});
