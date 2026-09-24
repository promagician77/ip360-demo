/**
 * PairSync™ rule definitions.
 *
 * Every rule is a small pure function that returns a RuleTrace. The engine
 * (engine.ts) composes them. Keeping rules isolated makes each one individually
 * testable and lets the documented methodology map 1:1 onto code.
 *
 * Rule IDs are referenced in docs/MATCHING_RULES.md.
 */
import type { CompatibilityProfile, ChildrenPlan, Intent } from "../assessment/profile";
import { CHOICE_LABELS } from "../assessment/profile";
import type { RuleTrace } from "./types";

type P = CompatibilityProfile;

/* ---------------------------- Eligibility ------------------------------- */

export function ruleSeeking(a: P, b: P): RuleTrace {
  const aOk = a.preferences.seeking.includes(b.demographics.gender);
  const bOk = b.preferences.seeking.includes(a.demographics.gender);
  return {
    ruleId: "E-01",
    name: "Mutual gender preference",
    stage: "eligibility",
    outcome: aOk && bOk ? "pass" : "fail",
    detail:
      aOk && bOk
        ? "Both people are looking to meet someone of the other's gender."
        : !aOk
          ? `${a.displayName} is not looking to meet ${CHOICE_LABELS.gender[b.demographics.gender].toLowerCase()}s.`
          : `${b.displayName} is not looking to meet ${CHOICE_LABELS.gender[a.demographics.gender].toLowerCase()}s.`,
  };
}

export function ruleAge(a: P, b: P): RuleTrace {
  const inRange = (p: P, age: number) => age >= p.preferences.ageMin && age <= p.preferences.ageMax;
  const aOk = inRange(a, b.demographics.age);
  const bOk = inRange(b, a.demographics.age);
  return {
    ruleId: "E-02",
    name: "Mutual age range",
    stage: "eligibility",
    outcome: aOk && bOk ? "pass" : "fail",
    detail:
      aOk && bOk
        ? `Ages ${a.demographics.age} and ${b.demographics.age} fall inside each other's preferred ranges.`
        : !aOk
          ? `${b.displayName} (${b.demographics.age}) is outside ${a.displayName}'s range of ${a.preferences.ageMin}–${a.preferences.ageMax}.`
          : `${a.displayName} (${a.demographics.age}) is outside ${b.displayName}'s range of ${b.preferences.ageMin}–${b.preferences.ageMax}.`,
  };
}

export function ruleDistance(a: P, b: P, km: number): RuleTrace {
  const aOk = km <= a.preferences.maxDistanceKm;
  const bOk = km <= b.preferences.maxDistanceKm;
  const rounded = Math.round(km);
  return {
    ruleId: "E-03",
    name: "Distance within both limits",
    stage: "eligibility",
    outcome: aOk && bOk ? "pass" : "fail",
    detail:
      aOk && bOk
        ? `${rounded} km apart, within both distance limits.`
        : `${rounded} km apart exceeds ${!aOk ? a.displayName : b.displayName}'s limit of ${
            !aOk ? a.preferences.maxDistanceKm : b.preferences.maxDistanceKm
          } km.`,
  };
}

/** Intent compatibility matrix. `soft` = eligible but penalised in M-05. */
export function intentCompat(x: Intent, y: Intent): "ok" | "soft" | "fail" {
  if (x === y) return "ok";
  const pair = [x, y].sort().join("+");
  if (pair === "long_term+marriage") return "ok";
  if (pair === "exploring+long_term") return "soft";
  return "fail"; // marriage + exploring
}

export function ruleIntent(a: P, b: P): RuleTrace {
  const c = intentCompat(a.intent, b.intent);
  return {
    ruleId: "E-04",
    name: "Relationship intent",
    stage: "eligibility",
    outcome: c === "fail" ? "fail" : "pass",
    detail:
      c === "ok"
        ? `Both are aligned: ${CHOICE_LABELS.intent[a.intent].toLowerCase()} and ${CHOICE_LABELS.intent[b.intent].toLowerCase()}.`
        : c === "soft"
          ? "One person is exploring while the other wants something long-term. Eligible, but noted."
          : "One person is ready for marriage and the other is still exploring. These intents don't line up.",
  };
}

/** Children compatibility. Returns true when the two plans can coexist. */
export function childrenCompat(x: ChildrenPlan, y: ChildrenPlan): boolean {
  const wantsMore = (c: ChildrenPlan) => c === "want" || c === "have_want_more";
  const noMore = (c: ChildrenPlan) => c === "dont_want" || c === "have_done";
  if (x === "open" || y === "open") return true;
  if (wantsMore(x) && noMore(y)) return false;
  if (noMore(x) && wantsMore(y)) return false;
  return true;
}

export function ruleChildren(a: P, b: P): RuleTrace {
  const ok = childrenCompat(a.children, b.children);
  return {
    ruleId: "E-05",
    name: "Children plans",
    stage: "eligibility",
    outcome: ok ? "pass" : "fail",
    detail: ok
      ? `${CHOICE_LABELS.children[a.children]} and ${CHOICE_LABELS.children[b.children].toLowerCase()} can coexist.`
      : `${a.displayName} ${CHOICE_LABELS.children[a.children].toLowerCase()} while ${b.displayName} ${CHOICE_LABELS.children[b.children].toLowerCase()}.`,
  };
}

/** Applies `self`'s dealbreakers against `other`. */
export function dealbreakerViolations(self: P, other: P): string[] {
  const v: string[] = [];
  for (const d of self.dealbreakers) {
    switch (d) {
      case "smoker":
        if (other.smoking === "regularly") v.push(`${other.displayName} smokes regularly`);
        break;
      case "heavy_drinker":
        if (other.drinking === "regularly") v.push(`${other.displayName} drinks regularly`);
        break;
      case "faith_mismatch":
        if (Math.abs(other.faithImportance - self.faithImportance) >= 3)
          v.push(`faith matters very differently to ${other.displayName}`);
        break;
      case "different_intent":
        if (other.intent !== self.intent)
          v.push(`${other.displayName} is looking for ${CHOICE_LABELS.intent[other.intent].toLowerCase()}`);
        break;
      case "kids_mismatch": {
        const definite = (c: ChildrenPlan) => c !== "open";
        if (!definite(other.children) || !childrenCompat(self.children, other.children))
          v.push(`${other.displayName} is ${CHOICE_LABELS.children[other.children].toLowerCase()}`);
        break;
      }
    }
  }
  return v;
}

export function ruleDealbreakers(a: P, b: P): RuleTrace {
  const va = dealbreakerViolations(a, b);
  const vb = dealbreakerViolations(b, a);
  const all = [
    ...va.map((x) => `${a.displayName}'s dealbreaker: ${x}.`),
    ...vb.map((x) => `${b.displayName}'s dealbreaker: ${x}.`),
  ];
  const skipped = a.dealbreakers.length === 0 && b.dealbreakers.length === 0;
  return {
    ruleId: "E-06",
    name: "Dealbreakers",
    stage: "eligibility",
    outcome: skipped ? "skipped" : all.length ? "fail" : "pass",
    detail: skipped
      ? "Neither person set dealbreakers."
      : all.length
        ? all.join(" ")
        : "No dealbreakers triggered on either side.",
  };
}

/* ------------------------------ Scoring --------------------------------- */

/** S-02: attachment style pairing matrix (0–100). */
export const ATTACHMENT_MATRIX: Record<string, number> = {
  "secure+secure": 100,
  "mixed+secure": 85,
  "anxious+secure": 80,
  "avoidant+secure": 75,
  "mixed+mixed": 70,
  "anxious+mixed": 65,
  "avoidant+mixed": 60,
  "anxious+anxious": 55,
  "avoidant+avoidant": 50,
  "anxious+avoidant": 35,
};

export function attachmentPairScore(x: string, y: string): number {
  return ATTACHMENT_MATRIX[[x, y].sort().join("+")] ?? 60;
}

/** S-03: conflict style pairing matrix (0–100). */
export const CONFLICT_MATRIX: Record<string, number> = {
  "collaborative+collaborative": 100,
  "collaborative+measured": 90,
  "collaborative+direct": 85,
  "direct+measured": 80,
  "measured+measured": 80,
  "direct+direct": 70,
  "avoidant+collaborative": 65,
  "avoidant+measured": 60,
  "avoidant+direct": 40,
  "avoidant+avoidant": 35,
};

export function conflictPairScore(x: string, y: string): number {
  return CONFLICT_MATRIX[[x, y].sort().join("+")] ?? 60;
}

export function similarity(a: number, b: number): number {
  return Math.max(0, 100 - Math.abs(a - b));
}
