import { describe, expect, it } from "vitest";
import type { CompatibilityProfile } from "@/lib/assessment/profile";
import { buildDemoProfiles } from "@/lib/demo/personas";
import {
  MODIFIER_CAP,
  applyModifiers,
  attachmentPairScore,
  childrenCompat,
  combinedWeights,
  conflictPairScore,
  dimensionCompatibility,
  distanceKm,
  intentCompat,
  matchProfiles,
  rankCandidates,
  ruleAge,
  ruleDealbreakers,
  ruleDistance,
  ruleSeeking,
  scoreDimensionsForPair,
  similarity,
  tierFor,
} from "@/lib/matching";

const profiles = buildDemoProfiles();
const by = (slug: string) => profiles.find((p) => p.profileId === `demo_${slug}`)!;
const clone = (p: CompatibilityProfile, patch: (c: CompatibilityProfile) => void) => {
  const c = structuredClone(p);
  patch(c);
  return c;
};

describe("Eligibility rules", () => {
  it("E-01 fails when either side is not seeking the other's gender", () => {
    const a = by("maya"); // seeking man
    const b = clone(by("daniel"), (c) => (c.preferences.seeking = ["man"]));
    expect(ruleSeeking(a, b).outcome).toBe("fail");
    expect(ruleSeeking(by("maya"), by("daniel")).outcome).toBe("pass");
  });

  it("E-02 enforces age ranges in both directions", () => {
    const a = clone(by("maya"), (c) => (c.preferences.ageMax = 32));
    expect(ruleAge(a, by("daniel")).outcome).toBe("fail"); // Daniel is 33
    const b = clone(by("daniel"), (c) => (c.preferences.ageMin = 32));
    expect(ruleAge(by("maya"), b).outcome).toBe("fail"); // Maya is 31
  });

  it("E-03 uses the stricter of the two distance limits", () => {
    const km = distanceKm(30.2672, -97.7431, 29.4241, -98.4936); // Austin ↔ San Antonio ≈ 118 km
    expect(km).toBeGreaterThan(110);
    expect(km).toBeLessThan(125);
    expect(ruleDistance(by("maya"), by("marcus"), km).outcome).toBe("fail"); // Maya max 80
    expect(ruleDistance(by("chloe"), by("marcus"), 118).outcome).toBe("pass"); // 300 / 150
  });

  it("E-04 intent matrix", () => {
    expect(intentCompat("marriage", "marriage")).toBe("ok");
    expect(intentCompat("marriage", "long_term")).toBe("ok");
    expect(intentCompat("long_term", "exploring")).toBe("soft");
    expect(intentCompat("marriage", "exploring")).toBe("fail");
  });

  it("E-05 children matrix", () => {
    expect(childrenCompat("want", "dont_want")).toBe(false);
    expect(childrenCompat("have_want_more", "have_done")).toBe(false);
    expect(childrenCompat("want", "have_done")).toBe(false);
    expect(childrenCompat("dont_want", "have_done")).toBe(true);
    expect(childrenCompat("want", "open")).toBe(true);
    expect(childrenCompat("open", "open")).toBe(true);
  });

  it("E-06 smoker dealbreaker fails against a regular smoker only", () => {
    expect(ruleDealbreakers(by("maya"), by("ethan")).outcome).toBe("fail");
    expect(ruleDealbreakers(by("maya"), by("leo")).outcome).toBe("pass"); // social smoker
  });

  it("E-06 kids_mismatch dealbreaker rejects an 'open' answer", () => {
    // Priya (dont_want, dealbreaker kids_mismatch) vs Sam (open)
    expect(ruleDealbreakers(by("priya"), by("sam")).outcome).toBe("fail");
    // Priya vs Noah (have_done): compatible and definite
    expect(ruleDealbreakers(by("priya"), by("noah")).outcome).toBe("pass");
  });

  it("E-06 faith_mismatch dealbreaker needs a gap of 3+", () => {
    expect(ruleDealbreakers(by("grace"), by("leo")).outcome).toBe("fail"); // 5 vs 1
    expect(ruleDealbreakers(by("grace"), by("maya")).outcome).toBe("pass"); // 5 vs 3
  });

  it("E-06 is skipped when neither side set dealbreakers", () => {
    expect(ruleDealbreakers(by("leo"), by("jordan")).outcome).toBe("skipped");
  });

  it("ineligible pairs get score 0 and tier ineligible", () => {
    const r = matchProfiles(by("maya"), by("leo")); // marriage vs exploring
    expect(r.eligible).toBe(false);
    expect(r.score).toBe(0);
    expect(r.tier).toBe("ineligible");
    expect(r.explanation.ruleTrail.some((t) => t.ruleId === "E-04" && t.outcome === "fail")).toBe(true);
    expect(r.explanation.watchouts.length).toBeGreaterThan(0);
  });
});

describe("Scoring rules", () => {
  it("S-01 similarity is 100 minus absolute difference", () => {
    expect(similarity(80, 80)).toBe(100);
    expect(similarity(80, 50)).toBe(70);
    expect(similarity(0, 100)).toBe(0);
  });

  it("S-02 blends similarity with the attachment matrix (60/40)", () => {
    const a = clone(by("maya"), (c) => {
      c.dimensions.emotional = 80;
      c.traits.attachmentStyle = "secure";
    });
    const b = clone(by("daniel"), (c) => {
      c.dimensions.emotional = 60;
      c.traits.attachmentStyle = "anxious";
    });
    // 0.6 * 80 + 0.4 * 80 = 80
    expect(dimensionCompatibility("emotional", a, b)).toBe(80);
  });

  it("S-03 blends similarity with the conflict matrix (60/40)", () => {
    const a = clone(by("maya"), (c) => {
      c.dimensions.communication = 70;
      c.traits.conflictStyle = "avoidant";
    });
    const b = clone(by("daniel"), (c) => {
      c.dimensions.communication = 70;
      c.traits.conflictStyle = "direct";
    });
    // 0.6 * 100 + 0.4 * 40 = 76
    expect(dimensionCompatibility("communication", a, b)).toBe(76);
  });

  it("pairing matrices are symmetric", () => {
    expect(attachmentPairScore("anxious", "secure")).toBe(attachmentPairScore("secure", "anxious"));
    expect(conflictPairScore("direct", "avoidant")).toBe(conflictPairScore("avoidant", "direct"));
  });

  it("S-04 combined weights are the mean of both users' weights, normalised to 1", () => {
    const w = combinedWeights(by("maya"), by("leo"));
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 6);
    // Maya values=3, Leo values=1 → 2; Maya lifestyle=2, Leo lifestyle=3 → 2.5
    expect(w.lifestyle).toBeGreaterThan(w.values);
  });

  it("base score equals the weighted sum of dimension compatibilities", () => {
    const { breakdown, baseScore } = scoreDimensionsForPair(by("maya"), by("daniel"));
    const sum = breakdown.reduce((s, d) => s + d.compatibility * d.weight, 0);
    expect(Math.abs(baseScore - sum)).toBeLessThan(1);
  });

  it("identical profiles score 100 on every dimension", () => {
    const a = by("daniel");
    const b = clone(a, (c) => (c.profileId = "twin"));
    const { breakdown } = scoreDimensionsForPair(a, b);
    for (const d of breakdown) expect(d.compatibility).toBe(100);
  });
});

describe("Modifiers", () => {
  it("M-01 rewards shared faith and penalises a gap", () => {
    const shared = applyModifiers(by("grace"), by("marcus"), 10).find((m) => m.ruleId === "M-01")!;
    expect(shared.delta).toBe(4);
    const gap = applyModifiers(by("grace"), by("sofia"), 10).find((m) => m.ruleId === "M-01")!;
    expect(gap.delta).toBe(-4);
  });

  it("M-02 penalises never vs regularly smoking by 6", () => {
    const m = applyModifiers(by("sofia"), by("ethan"), 10).find((x) => x.ruleId === "M-02")!;
    expect(m.delta).toBe(-6);
  });

  it("M-04 penalises two non-relocators far apart", () => {
    const m = applyModifiers(by("noah"), by("marcus"), 118).find((x) => x.ruleId === "M-04")!;
    expect(m.delta).toBe(-8);
  });

  it("M-08 rewards two secure attachment styles", () => {
    const m = applyModifiers(by("maya"), by("daniel"), 1).find((x) => x.ruleId === "M-08")!;
    expect(m.delta).toBe(3);
  });

  it("total modifier is capped at ±MODIFIER_CAP", () => {
    // Noah (man, 40) and Priya (woman, 30) pass every eligibility rule; stack five penalties (−20 raw).
    const a = clone(by("noah"), (c) => {
      c.smoking = "never";
      c.drinking = "never";
      c.faithImportance = 5;
      c.traits.socialEnergy = "introvert";
      c.traits.planningStyle = "structured";
      c.dealbreakers = [];
    });
    const b = clone(by("priya"), (c) => {
      c.smoking = "regularly";
      c.drinking = "regularly";
      c.faithImportance = 1;
      c.traits.socialEnergy = "extrovert";
      c.traits.planningStyle = "flexible";
      c.dealbreakers = [];
    });
    const r = matchProfiles(a, b);
    expect(r.eligible).toBe(true);
    expect(r.modifierTotal).toBe(-MODIFIER_CAP);
    expect(r.score).toBe(Math.max(0, r.baseScore - MODIFIER_CAP));
  });
});

describe("Tiers and explanations", () => {
  it("T-01 thresholds", () => {
    expect(tierFor(85)).toBe("exceptional");
    expect(tierFor(84)).toBe("strong");
    expect(tierFor(70)).toBe("strong");
    expect(tierFor(69)).toBe("promising");
    expect(tierFor(55)).toBe("promising");
    expect(tierFor(54)).toBe("limited");
  });

  it("Maya and Daniel are an exceptional or strong match with explanations", () => {
    const r = matchProfiles(by("maya"), by("daniel"));
    expect(r.eligible).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(80);
    expect(["exceptional", "strong"]).toContain(r.tier);
    expect(r.explanation.strengths.length).toBeGreaterThan(0);
    expect(r.explanation.dimensions).toHaveLength(6);
    expect(r.explanation.summary).toContain("Maya");
  });

  it("is symmetric: A→B and B→A produce the same score", () => {
    for (const a of profiles) {
      for (const b of profiles) {
        if (a === b) continue;
        const ab = matchProfiles(a, b, new Date(0));
        const ba = matchProfiles(b, a, new Date(0));
        expect(ab.score).toBe(ba.score);
        expect(ab.eligible).toBe(ba.eligible);
      }
    }
  });

  it("rankCandidates sorts eligible matches first, highest score first", () => {
    const ranked = rankCandidates(by("maya"), profiles);
    expect(ranked.every((r) => r.profileB !== "demo_maya")).toBe(true);
    for (let i = 1; i < ranked.length; i++) {
      const prev = ranked[i - 1];
      const cur = ranked[i];
      if (prev.eligible && cur.eligible) expect(prev.score).toBeGreaterThanOrEqual(cur.score);
      if (!prev.eligible) expect(cur.eligible).toBe(false);
    }
    expect(ranked[0].profileB).toBe("demo_daniel");
  });
});
