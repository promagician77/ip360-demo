import { describe, expect, it } from "vitest";
import { LIKERT_QUESTIONS, DIMENSION_KEYS } from "@/lib/assessment/questions";
import {
  deriveTraits,
  effectiveScore,
  generateProfile,
  likertMeanTo100,
  scoreDimensions,
} from "@/lib/assessment/scoring";
import { compatibilityProfileSchema } from "@/lib/assessment/profile";
import { DEMO_PERSONAS, buildDemoProfiles } from "@/lib/demo/personas";

const all = (v: number) => Object.fromEntries(LIKERT_QUESTIONS.map((q) => [q.id, v]));

describe("Likert scoring", () => {
  it("maps the 1–5 scale to 0–100 linearly", () => {
    expect(likertMeanTo100(1)).toBe(0);
    expect(likertMeanTo100(3)).toBe(50);
    expect(likertMeanTo100(5)).toBe(100);
  });

  it("reverse-scores flagged items", () => {
    const reversed = LIKERT_QUESTIONS.find((q) => q.reverse)!;
    const normal = LIKERT_QUESTIONS.find((q) => !q.reverse)!;
    expect(effectiveScore(reversed, 5)).toBe(1);
    expect(effectiveScore(reversed, 2)).toBe(4);
    expect(effectiveScore(normal, 5)).toBe(5);
  });

  it("scores every dimension 100 when all effective answers are 5", () => {
    const answers = Object.fromEntries(LIKERT_QUESTIONS.map((q) => [q.id, q.reverse ? 1 : 5]));
    const scores = scoreDimensions(answers);
    for (const k of DIMENSION_KEYS) expect(scores[k]).toBe(100);
  });

  it("scores every dimension 50 for all-neutral answers", () => {
    const scores = scoreDimensions(all(3));
    for (const k of DIMENSION_KEYS) expect(scores[k]).toBe(50);
  });

  it("has exactly 5 items per dimension and 30 in total", () => {
    expect(LIKERT_QUESTIONS).toHaveLength(30);
    for (const k of DIMENSION_KEYS) {
      expect(LIKERT_QUESTIONS.filter((q) => q.dimension === k)).toHaveLength(5);
    }
  });
});

describe("Trait derivation", () => {
  it("detects a secure attachment style", () => {
    const t = deriveTraits({ ...all(3), e1: 5, e3: 4, e5: 5, e2: 2, e4: 2 });
    expect(t.attachmentStyle).toBe("secure");
  });

  it("detects anxious-leaning attachment when worry dominates", () => {
    const t = deriveTraits({ ...all(3), e2: 5, e4: 2 });
    expect(t.attachmentStyle).toBe("anxious");
  });

  it("detects avoidant-leaning attachment when withdrawal dominates", () => {
    const t = deriveTraits({ ...all(3), e2: 2, e4: 5 });
    expect(t.attachmentStyle).toBe("avoidant");
  });

  it("classifies social energy from both direct and reversed items", () => {
    expect(deriveTraits({ ...all(3), l1: 5, l5: 1 }).socialEnergy).toBe("extrovert");
    expect(deriveTraits({ ...all(3), l1: 1, l5: 5 }).socialEnergy).toBe("introvert");
    expect(deriveTraits({ ...all(3), l1: 3, l5: 3 }).socialEnergy).toBe("ambivert");
  });

  it("classifies planning style", () => {
    expect(deriveTraits({ ...all(3), l2: 5, l4: 1 }).planningStyle).toBe("structured");
    expect(deriveTraits({ ...all(3), l2: 1, l4: 5 }).planningStyle).toBe("flexible");
  });

  it("prioritises conflict avoidance over other conflict signals", () => {
    expect(deriveTraits({ ...all(3), c5: 5, c2: 5, c4: 5 }).conflictStyle).toBe("avoidant");
    expect(deriveTraits({ ...all(3), c5: 2, c2: 4, c4: 4 }).conflictStyle).toBe("collaborative");
    expect(deriveTraits({ ...all(3), c5: 2, c2: 2, c4: 3, c1: 5 }).conflictStyle).toBe("direct");
    expect(deriveTraits({ ...all(3), c5: 2, c2: 2, c4: 3, c1: 2 }).conflictStyle).toBe("measured");
  });
});

describe("Profile generation", () => {
  it("produces a schema-valid profile for every demo persona", () => {
    const profiles = buildDemoProfiles();
    expect(profiles).toHaveLength(DEMO_PERSONAS.length);
    for (const p of profiles) {
      expect(() => compatibilityProfileSchema.parse(p)).not.toThrow();
      expect(p.meta.completeness).toBe(1);
    }
  });

  it("rejects an incomplete assessment", () => {
    const persona = DEMO_PERSONAS[0];
    const likert = { ...persona.responses.likert };
    delete likert.v1;
    expect(() =>
      generateProfile({ ...persona.responses, likert }, { profileId: "x", lat: 0, lng: 0 }),
    ).toThrow(/Missing answers/);
  });

  it("rejects an inverted age range", () => {
    const persona = DEMO_PERSONAS[0];
    expect(() =>
      generateProfile({ ...persona.responses, ageMin: 40, ageMax: 30 }, { profileId: "x", lat: 0, lng: 0 }),
    ).toThrow();
  });

  it("is deterministic", () => {
    const persona = DEMO_PERSONAS[1];
    const opts = { profileId: "p", lat: 1, lng: 2, generatedAt: new Date(0) };
    expect(generateProfile(persona.responses, opts)).toEqual(generateProfile(persona.responses, opts));
  });
});
