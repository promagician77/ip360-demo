/**
 * Structured compatibility profile — the contract between PairKnow™ (assessment)
 * and PairSync™ (matching). PairSync only ever sees this shape; it never sees raw
 * assessment answers. External platforms can produce this shape themselves.
 */
import { z } from "zod";
import { DIMENSION_KEYS, type DimensionKey } from "./questions";

export const PROFILE_SCHEMA_VERSION = "1.0.0";

export const intentSchema = z.enum(["marriage", "long_term", "exploring"]);
export const childrenSchema = z.enum(["want", "open", "dont_want", "have_want_more", "have_done"]);
export const habitSchema = z.enum(["never", "socially", "regularly"]);
export const relocationSchema = z.enum(["yes", "maybe", "no"]);
export const genderSchema = z.enum(["woman", "man", "nonbinary"]);
export const dealbreakerSchema = z.enum([
  "smoker",
  "heavy_drinker",
  "kids_mismatch",
  "faith_mismatch",
  "different_intent",
]);

export const attachmentStyleSchema = z.enum(["secure", "anxious", "avoidant", "mixed"]);
export const socialEnergySchema = z.enum(["introvert", "ambivert", "extrovert"]);
export const planningStyleSchema = z.enum(["structured", "balanced", "flexible"]);
export const conflictStyleSchema = z.enum(["collaborative", "direct", "avoidant", "measured"]);
export const affectionStyleSchema = z.enum(["physical", "quality_time", "gestures", "balanced"]);

const score = z.number().min(0).max(100);
const weight = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const dimensionScoresSchema = z.object(
  Object.fromEntries(DIMENSION_KEYS.map((k) => [k, score])) as Record<DimensionKey, typeof score>,
);

export const dimensionWeightsSchema = z.object(
  Object.fromEntries(DIMENSION_KEYS.map((k) => [k, weight])) as Record<DimensionKey, typeof weight>,
);

export const compatibilityProfileSchema = z.object({
  schemaVersion: z.literal(PROFILE_SCHEMA_VERSION).default(PROFILE_SCHEMA_VERSION),
  profileId: z.string().min(1).max(80),
  displayName: z.string().min(1).max(40),
  demographics: z.object({
    age: z.number().int().min(18).max(99),
    gender: genderSchema,
    city: z.string().min(1).max(60),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    bio: z.string().max(160).optional(),
  }),
  dimensions: dimensionScoresSchema,
  traits: z.object({
    attachmentStyle: attachmentStyleSchema,
    socialEnergy: socialEnergySchema,
    planningStyle: planningStyleSchema,
    conflictStyle: conflictStyleSchema,
    affectionStyle: affectionStyleSchema,
  }),
  intent: intentSchema,
  children: childrenSchema,
  relocation: relocationSchema,
  faithImportance: z.number().int().min(1).max(5),
  smoking: habitSchema,
  drinking: habitSchema,
  dealbreakers: z.array(dealbreakerSchema).default([]),
  preferences: z.object({
    seeking: z.array(genderSchema).min(1),
    ageMin: z.number().int().min(18).max(99),
    ageMax: z.number().int().min(18).max(99),
    maxDistanceKm: z.number().min(1).max(20000),
    weights: dimensionWeightsSchema,
  }),
  meta: z
    .object({
      assessmentVersion: z.string().optional(),
      completeness: z.number().min(0).max(1).optional(),
      generatedAt: z.string().optional(),
    })
    .default({}),
});

export type CompatibilityProfile = z.infer<typeof compatibilityProfileSchema>;
export type DimensionScores = z.infer<typeof dimensionScoresSchema>;
export type DimensionWeights = z.infer<typeof dimensionWeightsSchema>;
export type Intent = z.infer<typeof intentSchema>;
export type ChildrenPlan = z.infer<typeof childrenSchema>;
export type Habit = z.infer<typeof habitSchema>;
export type Dealbreaker = z.infer<typeof dealbreakerSchema>;
export type Gender = z.infer<typeof genderSchema>;

export const TRAIT_LABELS = {
  attachmentStyle: {
    secure: "Secure",
    anxious: "Anxious-leaning",
    avoidant: "Avoidant-leaning",
    mixed: "Mixed",
  },
  socialEnergy: { introvert: "Introvert", ambivert: "Ambivert", extrovert: "Extrovert" },
  planningStyle: { structured: "Planner", balanced: "Balanced", flexible: "Spontaneous" },
  conflictStyle: {
    collaborative: "Collaborative",
    direct: "Direct",
    avoidant: "Conflict-avoidant",
    measured: "Measured",
  },
  affectionStyle: {
    physical: "Physical touch",
    quality_time: "Quality time",
    gestures: "Small gestures",
    balanced: "Balanced",
  },
} as const;

export const CHOICE_LABELS: Record<string, Record<string, string>> = {
  intent: { marriage: "Marriage", long_term: "Long-term relationship", exploring: "Exploring" },
  children: {
    want: "Wants children",
    open: "Open to children",
    dont_want: "Doesn't want children",
    have_want_more: "Has children, wants more",
    have_done: "Has children, doesn't want more",
  },
  relocation: { yes: "Would relocate", maybe: "Might relocate", no: "Won't relocate" },
  smoking: { never: "Non-smoker", socially: "Social smoker", regularly: "Regular smoker" },
  drinking: { never: "Doesn't drink", socially: "Social drinker", regularly: "Drinks regularly" },
  dealbreakers: {
    smoker: "Regular smoker",
    heavy_drinker: "Drinks regularly",
    kids_mismatch: "Undecided or mismatched on children",
    faith_mismatch: "Very different importance of faith",
    different_intent: "Different relationship intent",
  },
  gender: { woman: "Woman", man: "Man", nonbinary: "Non-binary" },
};
