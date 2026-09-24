/**
 * PairKnow™ scoring: converts raw assessment responses into a structured
 * CompatibilityProfile. Pure, deterministic, and fully unit-tested.
 */
import { z } from "zod";
import {
  ASSESSMENT_VERSION,
  DIMENSION_KEYS,
  LIKERT_QUESTIONS,
  STRUCTURED_QUESTIONS,
  type DimensionKey,
  type LikertQuestion,
} from "./questions";
import {
  childrenSchema,
  compatibilityProfileSchema,
  dealbreakerSchema,
  genderSchema,
  habitSchema,
  intentSchema,
  relocationSchema,
  type CompatibilityProfile,
  type DimensionScores,
  type DimensionWeights,
} from "./profile";

const likert = z.number().int().min(1).max(5);

/** Raw answers exactly as captured by the assessment UI. */
export const assessmentResponsesSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  age: z.number().int().min(18).max(99),
  gender: genderSchema,
  city: z.string().trim().min(1).max(60),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  bio: z.string().trim().max(160).optional(),
  intent: intentSchema,
  children: childrenSchema,
  relocation: relocationSchema,
  faithImportance: z.number().int().min(1).max(5),
  smoking: habitSchema,
  drinking: habitSchema,
  seeking: z.array(genderSchema).min(1),
  ageMin: z.number().int().min(18).max(99),
  ageMax: z.number().int().min(18).max(99),
  maxDistanceKm: z.number().min(1).max(20000),
  dealbreakers: z.array(dealbreakerSchema).default([]),
  weights: z.object(
    Object.fromEntries(
      DIMENSION_KEYS.map((k) => [k, z.union([z.literal(1), z.literal(2), z.literal(3)])]),
    ) as Record<DimensionKey, z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>>,
  ),
  likert: z.record(z.string(), likert),
}).refine((r) => r.ageMin <= r.ageMax, { message: "ageMin must be <= ageMax", path: ["ageMin"] });

export type AssessmentResponses = z.infer<typeof assessmentResponsesSchema>;

/** Partial draft used for autosave while the assessment is in progress. */
export const assessmentDraftSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  step: z.number().int().min(0).default(0),
});
export type AssessmentDraft = z.infer<typeof assessmentDraftSchema>;

/* ------------------------------------------------------------------------- */

export function effectiveScore(q: LikertQuestion, raw: number): number {
  return q.reverse ? 6 - raw : raw;
}

/** Maps a 1–5 mean to a 0–100 score. */
export function likertMeanTo100(mean: number): number {
  return Math.round(((mean - 1) / 4) * 100);
}

export function scoreDimensions(likertAnswers: Record<string, number>): DimensionScores {
  const result = {} as DimensionScores;
  for (const key of DIMENSION_KEYS) {
    const items = LIKERT_QUESTIONS.filter((q) => q.dimension === key);
    const vals = items.map((q) => effectiveScore(q, likertAnswers[q.id]));
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    result[key] = likertMeanTo100(mean);
  }
  return result;
}

function mean(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function deriveTraits(a: Record<string, number>): CompatibilityProfile["traits"] {
  // Attachment style — rule A1..A4 (see docs/MATCHING_RULES.md)
  const secure = mean([a.e1, a.e3, a.e5]);
  const anxious = a.e2;
  const avoidant = a.e4;
  let attachmentStyle: CompatibilityProfile["traits"]["attachmentStyle"];
  if (anxious >= 4 && anxious > avoidant) attachmentStyle = "anxious";
  else if (avoidant >= 4 && avoidant >= anxious) attachmentStyle = "avoidant";
  else if (secure >= 3.5) attachmentStyle = "secure";
  else attachmentStyle = "mixed";

  // Social energy — extroversion item plus reversed introversion item
  const social = mean([a.l1, 6 - a.l5]);
  const socialEnergy = social >= 4 ? "extrovert" : social <= 2.5 ? "introvert" : "ambivert";

  // Planning style — routine item plus reversed spontaneity item
  const plan = mean([a.l2, 6 - a.l4]);
  const planningStyle = plan >= 3.5 ? "structured" : plan <= 2.5 ? "flexible" : "balanced";

  // Conflict style
  const repair = mean([a.c2, a.c4]);
  let conflictStyle: CompatibilityProfile["traits"]["conflictStyle"];
  if (a.c5 >= 4) conflictStyle = "avoidant";
  else if (repair >= 3.5) conflictStyle = "collaborative";
  else if (a.c1 >= 4) conflictStyle = "direct";
  else conflictStyle = "measured";

  // Affection style
  let affectionStyle: CompatibilityProfile["traits"]["affectionStyle"];
  if (a.i1 >= 4 && a.i1 >= a.i2 && a.i1 >= a.i5) affectionStyle = "physical";
  else if (a.i2 >= 4 && a.i2 >= a.i5) affectionStyle = "quality_time";
  else if (a.i5 >= 4) affectionStyle = "gestures";
  else affectionStyle = "balanced";

  return { attachmentStyle, socialEnergy, planningStyle, conflictStyle, affectionStyle };
}

export interface GenerateProfileOptions {
  profileId: string;
  /** Resolved coordinates for the user's city. */
  lat: number;
  lng: number;
  generatedAt?: Date;
}

/** Validates responses, scores every dimension and returns a typed profile. */
export function generateProfile(
  input: unknown,
  opts: GenerateProfileOptions,
): CompatibilityProfile {
  const r = assessmentResponsesSchema.parse(input);

  const missing = LIKERT_QUESTIONS.filter((q) => r.likert[q.id] === undefined).map((q) => q.id);
  if (missing.length) {
    throw new Error(`Missing answers for: ${missing.join(", ")}`);
  }

  const dimensions = scoreDimensions(r.likert);
  const traits = deriveTraits(r.likert);

  const profile: CompatibilityProfile = {
    schemaVersion: "1.0.0",
    profileId: opts.profileId,
    displayName: r.displayName,
    demographics: {
      age: r.age,
      gender: r.gender,
      city: r.city,
      lat: r.lat ?? opts.lat,
      lng: r.lng ?? opts.lng,
      bio: r.bio || undefined,
    },
    dimensions,
    traits,
    intent: r.intent,
    children: r.children,
    relocation: r.relocation,
    faithImportance: r.faithImportance,
    smoking: r.smoking,
    drinking: r.drinking,
    dealbreakers: r.dealbreakers,
    preferences: {
      seeking: r.seeking,
      ageMin: r.ageMin,
      ageMax: r.ageMax,
      maxDistanceKm: r.maxDistanceKm,
      weights: r.weights as DimensionWeights,
    },
    meta: {
      assessmentVersion: ASSESSMENT_VERSION,
      completeness: 1,
      generatedAt: (opts.generatedAt ?? new Date()).toISOString(),
    },
  };

  return compatibilityProfileSchema.parse(profile);
}

/** Total number of answerable items, used for progress display. */
export const TOTAL_ITEMS = STRUCTURED_QUESTIONS.length + LIKERT_QUESTIONS.length + DIMENSION_KEYS.length;
