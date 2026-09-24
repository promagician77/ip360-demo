# Matching rules (engine v1.0.0)

This is the rule set implemented in `src/lib/matching`. Each rule ID appears in code, in tests
(`tests/matching.test.ts`) and in the `ruleTrail` of every API response. When the client's
documented methodology is adopted, this file is the checklist: one row = one function = one test.

## Stage 1 — Eligibility (all must pass)

| ID | Rule | Fails when |
| --- | --- | --- |
| E-01 | Mutual gender preference | Either person's gender is not in the other's `seeking`. |
| E-02 | Mutual age range | Either age is outside the other's `[ageMin, ageMax]`. |
| E-03 | Distance | Haversine distance exceeds either person's `maxDistanceKm`. |
| E-04 | Intent | `marriage` × `exploring`. (`long_term` × `exploring` passes but triggers M-05.) |
| E-05 | Children | One wants (more) children (`want`, `have_want_more`) and the other does not (`dont_want`, `have_done`). `open` is compatible with everything. |
| E-06 | Dealbreakers | Any of a person's dealbreakers is violated by the other: `smoker` (other smokes regularly), `heavy_drinker` (other drinks regularly), `faith_mismatch` (gap ≥ 3), `different_intent` (intents differ), `kids_mismatch` (other is `open` or incompatible). Skipped when neither set any. |

Ineligible pairs return `score = 0`, `tier = ineligible`, and the failed rules in the explanation.
The dimension breakdown is still computed for display but does not affect the score.

## Stage 2 — Dimension scoring

| ID | Rule | Formula |
| --- | --- | --- |
| S-01 | Similarity | `100 − |a − b|` for values, lifestyle, goals, intimacy. |
| S-02 | Emotional blend | `0.6 × similarity + 0.4 × ATTACHMENT_MATRIX[styleA, styleB]`. |
| S-03 | Communication blend | `0.6 × similarity + 0.4 × CONFLICT_MATRIX[styleA, styleB]`. |
| S-04 | Weighted composite | `w_k = (weightA_k + weightB_k) / 2`, normalised to Σ = 1. `baseScore = round(Σ compat_k × w_k)`. |

Attachment matrix: secure×secure 100 · mixed×secure 85 · anxious×secure 80 · avoidant×secure 75 ·
mixed×mixed 70 · anxious×mixed 65 · avoidant×mixed 60 · anxious×anxious 55 · avoidant×avoidant 50 ·
anxious×avoidant 35.

Conflict matrix: collaborative×collaborative 100 · collaborative×measured 90 · collaborative×direct 85 ·
direct×measured 80 · measured×measured 80 · direct×direct 70 · avoidant×collaborative 65 ·
avoidant×measured 60 · avoidant×direct 40 · avoidant×avoidant 35.

Bands for narratives: excellent ≥ 85, good ≥ 70, moderate ≥ 50, else low.

## Stage 3 — Modifiers (sum capped at ±15)

| ID | Rule | Delta |
| --- | --- | --- |
| M-01 | Faith | +4 if both ≥ 4; −4 if gap ≥ 2; else 0. |
| M-02 | Smoking | −6 for never × regularly; −2 for any other difference. |
| M-03 | Drinking | −4 for never × regularly. |
| M-04 | Relocation | −8 if both `no` and distance > 50 km; +2 if distance > 50 km and either `yes`. |
| M-05 | Intent gap | −6 for long_term × exploring. |
| M-06 | Social energy | −3 for introvert × extrovert. |
| M-07 | Planning style | −3 for structured × flexible. |
| M-08 | Secure pair | +3 if both secure. |

`score = clamp(baseScore + clamp(Σ modifiers, −15, +15), 0, 100)`.

## Stage 4 — Tier (T-01)

| Tier | Score |
| --- | --- |
| exceptional | ≥ 85 |
| strong | 70–84 |
| promising | 55–69 |
| limited | < 55 |

## Explanation assembly

- `strengths`: up to 3 dimensions with compatibility ≥ 70, best first.
- `watchouts`: up to 2 dimensions with compatibility < 70 (worst first) plus any modifier with
  delta ≤ −4. For ineligible pairs: the failed eligibility rules.
- `summary`: a tier-specific template naming the two best dimensions.
- All text is deterministic; no LLM is involved.

## Trait derivation (PairKnow, feeds S-02/S-03/M-06/M-07/M-08)

| Trait | Rule |
| --- | --- |
| attachmentStyle | anxious if e2 ≥ 4 and e2 > e4; avoidant if e4 ≥ 4 and e4 ≥ e2; secure if mean(e1,e3,e5) ≥ 3.5; else mixed. |
| socialEnergy | s = mean(l1, 6−l5): ≥ 4 extrovert, ≤ 2.5 introvert, else ambivert. |
| planningStyle | p = mean(l2, 6−l4): ≥ 3.5 structured, ≤ 2.5 flexible, else balanced. |
| conflictStyle | avoidant if c5 ≥ 4; collaborative if mean(c2,c4) ≥ 3.5; direct if c1 ≥ 4; else measured. |
| affectionStyle | physical if i1 ≥ 4 and i1 ≥ i2, i5; quality_time if i2 ≥ 4 and i2 ≥ i5; gestures if i5 ≥ 4; else balanced. |
