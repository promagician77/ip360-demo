/**
 * PairSync™ matching engine.
 *
 * Pipeline:
 *   1. Eligibility rules (E-01 … E-06). Any failure → ineligible, score 0.
 *   2. Dimension scoring (S-01 … S-04). Weighted composite → baseScore.
 *   3. Modifiers (M-01 … M-08). Bounded bonuses/penalties → final score.
 *   4. Tiering (T-01) and explanation generation.
 *
 * The engine is pure: same two profiles always produce the same result.
 */
import { DIMENSIONS, DIMENSION_KEYS, type DimensionKey } from "../assessment/questions";
import type { CompatibilityProfile } from "../assessment/profile";
import { TRAIT_LABELS } from "../assessment/profile";
import { distanceKm } from "./geo";
import {
  attachmentPairScore,
  conflictPairScore,
  intentCompat,
  ruleAge,
  ruleChildren,
  ruleDealbreakers,
  ruleDistance,
  ruleIntent,
  ruleSeeking,
  similarity,
} from "./rules";
import {
  ENGINE_VERSION,
  type DimensionBreakdown,
  type Explanation,
  type MatchResult,
  type RuleTrace,
  type Tier,
} from "./types";

type P = CompatibilityProfile;

/* ------------------------------------------------------------------------ */
/*  Tiering (T-01)                                                           */
/* ------------------------------------------------------------------------ */

export const TIER_THRESHOLDS: { tier: Tier; min: number }[] = [
  { tier: "exceptional", min: 85 },
  { tier: "strong", min: 70 },
  { tier: "promising", min: 55 },
  { tier: "limited", min: 0 },
];

export const TIER_LABELS: Record<Tier, string> = {
  exceptional: "Exceptional match",
  strong: "Strong match",
  promising: "Promising match",
  limited: "Limited compatibility",
  ineligible: "Not a match",
};

export function tierFor(score: number): Tier {
  return TIER_THRESHOLDS.find((t) => score >= t.min)!.tier;
}

/* ------------------------------------------------------------------------ */
/*  Dimension scoring (S-01 … S-04)                                          */
/* ------------------------------------------------------------------------ */

/** S-01/S-02/S-03: per-dimension compatibility 0–100. */
export function dimensionCompatibility(key: DimensionKey, a: P, b: P): number {
  const sim = similarity(a.dimensions[key], b.dimensions[key]);
  if (key === "emotional") {
    // S-02: 60% score similarity + 40% attachment-style pairing
    return Math.round(0.6 * sim + 0.4 * attachmentPairScore(a.traits.attachmentStyle, b.traits.attachmentStyle));
  }
  if (key === "communication") {
    // S-03: 60% score similarity + 40% conflict-style pairing
    return Math.round(0.6 * sim + 0.4 * conflictPairScore(a.traits.conflictStyle, b.traits.conflictStyle));
  }
  return sim; // S-01
}

/** S-04: normalised weights = mean of both people's importance ratings. */
export function combinedWeights(a: P, b: P): Record<DimensionKey, number> {
  const raw = DIMENSION_KEYS.map((k) => (a.preferences.weights[k] + b.preferences.weights[k]) / 2);
  const total = raw.reduce((x, y) => x + y, 0);
  return Object.fromEntries(DIMENSION_KEYS.map((k, i) => [k, raw[i] / total])) as Record<DimensionKey, number>;
}

function bandFor(c: number): DimensionBreakdown["band"] {
  return c >= 85 ? "excellent" : c >= 70 ? "good" : c >= 50 ? "moderate" : "low";
}

const NARRATIVES: Record<DimensionKey, Record<DimensionBreakdown["band"], (a: P, b: P) => string>> = {
  values: {
    excellent: (a, b) => `${a.displayName} and ${b.displayName} place almost identical importance on family, honesty and tradition. A shared foundation.`,
    good: () => "Your core values line up well, with only small differences in what you each prioritise.",
    moderate: () => "You share some values but weigh things like ambition and tradition differently. Worth an early conversation.",
    low: () => "Your core priorities point in noticeably different directions. This tends to surface in big decisions.",
  },
  emotional: {
    excellent: (a, b) => `Both bring a ${TRAIT_LABELS.attachmentStyle[a.traits.attachmentStyle].toLowerCase()} style that pairs naturally with ${b.displayName}'s ${TRAIT_LABELS.attachmentStyle[b.traits.attachmentStyle].toLowerCase()} style. Trust should come easily.`,
    good: () => "You are emotionally steady with each other in most situations, with room to grow in how you handle stress together.",
    moderate: (a, b) => `${a.displayName} is ${TRAIT_LABELS.attachmentStyle[a.traits.attachmentStyle].toLowerCase()} and ${b.displayName} is ${TRAIT_LABELS.attachmentStyle[b.traits.attachmentStyle].toLowerCase()}. Workable, but you'll need patience with each other's needs for reassurance or space.`,
    low: () => "Your emotional styles pull in opposite directions, which often creates a push-pull dynamic without deliberate effort.",
  },
  lifestyle: {
    excellent: () => "Your day-to-day rhythms are strikingly similar: same energy, same pace, same idea of a good week.",
    good: () => "You'd fit easily into each other's weeks with a few small compromises on pace and plans.",
    moderate: (a, b) => `${a.displayName} is ${TRAIT_LABELS.socialEnergy[a.traits.socialEnergy].toLowerCase()} and ${b.displayName} is ${TRAIT_LABELS.socialEnergy[b.traits.socialEnergy].toLowerCase()}. Expect to negotiate how often you go out and how much is planned.`,
    low: () => "Your lifestyles run at different speeds. Sustainable, but only with honest agreements about time and energy.",
  },
  communication: {
    excellent: () => "You communicate in compatible ways: both listen, both repair quickly, and neither avoids the hard conversations.",
    good: () => "Your communication styles complement each other well, with minor differences in directness.",
    moderate: (a, b) => `${a.displayName}'s ${TRAIT_LABELS.conflictStyle[a.traits.conflictStyle].toLowerCase()} style meets ${b.displayName}'s ${TRAIT_LABELS.conflictStyle[b.traits.conflictStyle].toLowerCase()} style. Misunderstandings are likely unless you name them early.`,
    low: () => "One of you tends to avoid conflict while the other confronts it. This is the most common source of friction.",
  },
  goals: {
    excellent: () => "You want the same things from life on nearly the same timeline. Commitment, family and career priorities align.",
    good: () => "Your life goals are compatible, with small differences in timing or emphasis.",
    moderate: () => "You agree on the big picture but differ on timing, career trade-offs or where to settle.",
    low: () => "Your visions of the next five years look quite different. Alignment here is hard to negotiate later.",
  },
  intimacy: {
    excellent: () => "You give and receive affection in the same language, and want similar amounts of closeness and space.",
    good: () => "Your needs for closeness are similar, with slightly different preferred ways of showing it.",
    moderate: (a, b) => `${a.displayName} shows love through ${TRAIT_LABELS.affectionStyle[a.traits.affectionStyle].toLowerCase()} and ${b.displayName} through ${TRAIT_LABELS.affectionStyle[b.traits.affectionStyle].toLowerCase()}. Learnable, but not automatic.`,
    low: () => "One of you needs considerably more closeness than the other. Unspoken, this becomes resentment.",
  },
};

export function scoreDimensionsForPair(a: P, b: P): { breakdown: DimensionBreakdown[]; baseScore: number } {
  const weights = combinedWeights(a, b);
  const breakdown: DimensionBreakdown[] = DIMENSION_KEYS.map((key) => {
    const compatibility = dimensionCompatibility(key, a, b);
    const weight = weights[key];
    const contribution = compatibility * weight;
    const band = bandFor(compatibility);
    return {
      key,
      label: DIMENSIONS[key].label,
      scoreA: a.dimensions[key],
      scoreB: b.dimensions[key],
      compatibility,
      weight: Math.round(weight * 1000) / 1000,
      contribution: Math.round(contribution * 10) / 10,
      band,
      narrative: NARRATIVES[key][band](a, b),
    };
  });
  const baseScore = Math.round(breakdown.reduce((s, d) => s + d.compatibility * weights[d.key], 0));
  return { breakdown, baseScore };
}

/* ------------------------------------------------------------------------ */
/*  Modifiers (M-01 … M-08)                                                  */
/* ------------------------------------------------------------------------ */

export const MODIFIER_CAP = 15;

export function applyModifiers(a: P, b: P, km: number): RuleTrace[] {
  const t: RuleTrace[] = [];
  const mod = (ruleId: string, name: string, delta: number, detail: string) =>
    t.push({ ruleId, name, stage: "modifier", outcome: delta > 0 ? "bonus" : delta < 0 ? "penalty" : "neutral", delta, detail });

  // M-01 Faith alignment
  const faithGap = Math.abs(a.faithImportance - b.faithImportance);
  if (a.faithImportance >= 4 && b.faithImportance >= 4)
    mod("M-01", "Shared faith", +4, "Faith is central to both of you.");
  else if (faithGap >= 2)
    mod("M-01", "Faith gap", -4, `Faith matters ${faithGap >= 3 ? "much " : ""}more to one of you than the other.`);
  else mod("M-01", "Faith alignment", 0, "Similar importance placed on faith.");

  // M-02 Smoking
  const smokeSet = new Set([a.smoking, b.smoking]);
  if (a.smoking !== b.smoking && smokeSet.has("never") && smokeSet.has("regularly"))
    mod("M-02", "Smoking mismatch", -6, "One of you never smokes and the other smokes regularly.");
  else if (a.smoking !== b.smoking)
    mod("M-02", "Smoking difference", -2, "Slightly different smoking habits.");
  else mod("M-02", "Smoking", 0, "Matching smoking habits.");

  // M-03 Drinking
  const drinkSet = new Set([a.drinking, b.drinking]);
  if (a.drinking !== b.drinking && drinkSet.has("never") && drinkSet.has("regularly"))
    mod("M-03", "Drinking mismatch", -4, "One of you doesn't drink and the other drinks regularly.");
  else mod("M-03", "Drinking", 0, "Compatible drinking habits.");

  // M-04 Relocation
  if (a.relocation === "no" && b.relocation === "no" && km > 50)
    mod("M-04", "Neither would relocate", -8, `${Math.round(km)} km apart and neither of you would move.`);
  else if (km > 50 && (a.relocation === "yes" || b.relocation === "yes"))
    mod("M-04", "Open to relocating", +2, "Distance is real, but at least one of you would move for the right person.");
  else mod("M-04", "Relocation", 0, "Distance is not a factor.");

  // M-05 Soft intent gap
  if (intentCompat(a.intent, b.intent) === "soft")
    mod("M-05", "Intent gap", -6, "One is exploring while the other wants long-term.");
  else mod("M-05", "Intent", 0, "Intent is aligned.");

  // M-06 Social energy gap
  const energies = new Set([a.traits.socialEnergy, b.traits.socialEnergy]);
  if (energies.has("introvert") && energies.has("extrovert"))
    mod("M-06", "Energy gap", -3, "An introvert and an extrovert. Complementary for some, tiring for others.");
  else mod("M-06", "Social energy", 0, "Similar social energy.");

  // M-07 Planning style gap
  const plans = new Set([a.traits.planningStyle, b.traits.planningStyle]);
  if (plans.has("structured") && plans.has("flexible"))
    mod("M-07", "Planning gap", -3, "A planner and a spontaneous type. Expect friction over weekends.");
  else mod("M-07", "Planning style", 0, "Compatible approach to plans.");

  // M-08 Both secure
  if (a.traits.attachmentStyle === "secure" && b.traits.attachmentStyle === "secure")
    mod("M-08", "Both secure", +3, "Two secure attachment styles: the most resilient pairing.");
  else mod("M-08", "Attachment bonus", 0, "No secure-pair bonus.");

  return t;
}

/* ------------------------------------------------------------------------ */
/*  Explanation                                                              */
/* ------------------------------------------------------------------------ */

function buildExplanation(a: P, b: P, score: number, tier: Tier, breakdown: DimensionBreakdown[], trail: RuleTrace[]): Explanation {
  const eligible = tier !== "ineligible";
  const sorted = [...breakdown].sort((x, y) => y.compatibility - x.compatibility);
  const strengths = eligible
    ? sorted.filter((d) => d.compatibility >= 70).slice(0, 3).map((d) => `${d.label} (${d.compatibility}): ${d.narrative}`)
    : [];
  const watchouts = eligible
    ? [
        ...sorted.filter((d) => d.compatibility < 70).slice(-2).reverse().map((d) => `${d.label} (${d.compatibility}): ${d.narrative}`),
        ...trail.filter((r) => r.stage === "modifier" && (r.delta ?? 0) <= -4).map((r) => `${r.name}: ${r.detail}`),
      ]
    : trail.filter((r) => r.outcome === "fail").map((r) => `${r.name}: ${r.detail}`);

  const headline = eligible
    ? `${TIER_LABELS[tier]} · ${score}/100`
    : "Not a match";

  const topDims = sorted.slice(0, 2).map((d) => d.label.toLowerCase());
  const summary = !eligible
    ? `${a.displayName} and ${b.displayName} aren't eligible to match because ${trail
        .filter((r) => r.outcome === "fail")
        .map((r) => r.name.toLowerCase())
        .join(" and ")} didn't line up. No compatibility score is computed for ineligible pairs.`
    : tier === "exceptional"
      ? `${a.displayName} and ${b.displayName} align across nearly every dimension, especially ${topDims.join(" and ")}. This is a rare pairing.`
      : tier === "strong"
        ? `${a.displayName} and ${b.displayName} are strongly compatible, led by ${topDims.join(" and ")}. The differences that remain are the kind couples navigate well.`
        : tier === "promising"
          ? `${a.displayName} and ${b.displayName} have a promising foundation in ${topDims.join(" and ")}, with a few areas that will need honest conversation.`
          : `${a.displayName} and ${b.displayName} are eligible to match but differ in several important areas. Compatibility here would take real work.`;

  return { headline, summary, strengths, watchouts, dimensions: breakdown, ruleTrail: trail };
}

/* ------------------------------------------------------------------------ */
/*  Entry point                                                              */
/* ------------------------------------------------------------------------ */

export function matchProfiles(a: P, b: P, now: Date = new Date()): MatchResult {
  const km = distanceKm(a.demographics.lat, a.demographics.lng, b.demographics.lat, b.demographics.lng);

  const eligibility: RuleTrace[] = [
    ruleSeeking(a, b),
    ruleAge(a, b),
    ruleDistance(a, b, km),
    ruleIntent(a, b),
    ruleChildren(a, b),
    ruleDealbreakers(a, b),
  ];
  const eligible = eligibility.every((r) => r.outcome !== "fail");

  const base = { profileA: a.profileId, profileB: b.profileId, engineVersion: ENGINE_VERSION, distanceKm: Math.round(km * 10) / 10, computedAt: now.toISOString() };

  if (!eligible) {
    // Still compute the breakdown so the UI can show "what would have been", but score stays 0.
    const { breakdown } = scoreDimensionsForPair(a, b);
    return {
      ...base,
      eligible: false,
      score: 0,
      baseScore: 0,
      modifierTotal: 0,
      tier: "ineligible",
      explanation: buildExplanation(a, b, 0, "ineligible", breakdown, eligibility),
    };
  }

  const { breakdown, baseScore } = scoreDimensionsForPair(a, b);
  const modifiers = applyModifiers(a, b, km);
  const rawMod = modifiers.reduce((s, m) => s + (m.delta ?? 0), 0);
  const modifierTotal = Math.max(-MODIFIER_CAP, Math.min(MODIFIER_CAP, rawMod));
  const score = Math.max(0, Math.min(100, baseScore + modifierTotal));
  const tier = tierFor(score);

  const scoringTrace: RuleTrace = {
    ruleId: "S-04",
    name: "Weighted composite",
    stage: "scoring",
    outcome: "neutral",
    detail: `Base score ${baseScore} from six weighted dimensions. Modifiers ${modifierTotal >= 0 ? "+" : ""}${modifierTotal} (capped at ±${MODIFIER_CAP}).`,
  };

  const trail = [...eligibility, scoringTrace, ...modifiers];
  return {
    ...base,
    eligible: true,
    score,
    baseScore,
    modifierTotal,
    tier,
    explanation: buildExplanation(a, b, score, tier, breakdown, trail),
  };
}

/** Ranks candidates for a seeker, best first. Ineligible candidates are kept at the bottom. */
export function rankCandidates(seeker: P, candidates: P[], now: Date = new Date()): MatchResult[] {
  return candidates
    .filter((c) => c.profileId !== seeker.profileId)
    .map((c) => matchProfiles(seeker, c, now))
    .sort((x, y) => Number(y.eligible) - Number(x.eligible) || y.score - x.score);
}
