import type { DimensionKey } from "../assessment/questions";

export const ENGINE_VERSION = "1.0.0";

export type Tier = "exceptional" | "strong" | "promising" | "limited" | "ineligible";

export type RuleStage = "eligibility" | "scoring" | "modifier";
export type RuleOutcome = "pass" | "fail" | "bonus" | "penalty" | "neutral" | "skipped";

export interface RuleTrace {
  ruleId: string;
  name: string;
  stage: RuleStage;
  outcome: RuleOutcome;
  /** Points added/removed from the composite (modifiers only). */
  delta?: number;
  detail: string;
}

export interface DimensionBreakdown {
  key: DimensionKey;
  label: string;
  scoreA: number;
  scoreB: number;
  /** 0–100 dimension compatibility after blending. */
  compatibility: number;
  /** Normalised weight applied (sums to 1 across dimensions). */
  weight: number;
  /** Points this dimension contributed to the base score. */
  contribution: number;
  band: "excellent" | "good" | "moderate" | "low";
  narrative: string;
}

export interface Explanation {
  headline: string;
  summary: string;
  strengths: string[];
  watchouts: string[];
  dimensions: DimensionBreakdown[];
  ruleTrail: RuleTrace[];
}

export interface MatchResult {
  engineVersion: string;
  profileA: string;
  profileB: string;
  eligible: boolean;
  /** 0–100 composite. 0 when ineligible. */
  score: number;
  baseScore: number;
  modifierTotal: number;
  tier: Tier;
  distanceKm: number;
  explanation: Explanation;
  computedAt: string;
}
