import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DIMENSIONS, DIMENSION_KEYS, LIKERT_QUESTIONS } from "@/lib/assessment/questions";
import { ATTACHMENT_MATRIX, CONFLICT_MATRIX } from "@/lib/matching/rules";
import { MODIFIER_CAP, TIER_THRESHOLDS } from "@/lib/matching/engine";
import { PageHero } from "@/components/PageHero";

export const metadata = { title: "Methodology" };

const ELIGIBILITY = [
  ["E-01", "Mutual gender preference", "Each person's gender must be in the other's 'seeking' list."],
  ["E-02", "Mutual age range", "Each person's age must fall inside the other's preferred range."],
  ["E-03", "Distance", "Great-circle distance must be within both people's maximum."],
  ["E-04", "Relationship intent", "Marriage ↔ exploring is incompatible. Long-term ↔ exploring is allowed but penalised (M-05)."],
  ["E-05", "Children plans", "Someone who wants (more) children cannot match someone who is done or doesn't want any. 'Open' matches anything."],
  ["E-06", "Dealbreakers", "Each person's dealbreakers are checked against the other. Any hit removes the match."],
];

const MODIFIERS = [
  ["M-01", "Faith alignment", "+4 if both rate faith 4–5; −4 if the gap is 2 or more."],
  ["M-02", "Smoking", "−6 for never vs regularly; −2 for any other difference."],
  ["M-03", "Drinking", "−4 for never vs regularly."],
  ["M-04", "Relocation", "−8 if both won't relocate and they are more than 50 km apart; +2 if far apart but one would move."],
  ["M-05", "Intent gap", "−6 for long-term ↔ exploring."],
  ["M-06", "Social energy", "−3 for introvert ↔ extrovert."],
  ["M-07", "Planning style", "−3 for planner ↔ spontaneous."],
  ["M-08", "Secure pair", "+3 when both have a secure attachment style."],
];

export default function MethodologyPage() {
  return (
    <>
      <SiteHeader />
      <PageHero img="/images/methodology.jpg" eyebrow="Methodology" title={<>How scoring and matching <span className="display-italic">work</span>.</>}>
        This page documents the placeholder methodology in the prototype. In the real engagement these rules are replaced 1:1 by the
        client&apos;s documented methodology. Each rule below maps to one function with one test.
      </PageHero>
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12 sm:px-8">
        <Section title="1. Assessment scoring" id="scoring">
          <p>
            Thirty agreement items (1 = strongly disagree, 5 = strongly agree), five per dimension. Reverse-keyed items are flipped
            (6 − answer). Each dimension score is the mean of its five items mapped linearly to 0–100.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {DIMENSION_KEYS.map((k) => (
              <div key={k} className="rounded-xl bg-bg-soft p-4">
                <div className="font-semibold">{DIMENSIONS[k].label}</div>
                <ul className="mt-2 space-y-1 text-sm text-fg-muted">
                  {LIKERT_QUESTIONS.filter((q) => q.dimension === k).map((q) => (
                    <li key={q.id}>
                      <span className="mono text-xs text-fg-faint">{q.id}</span> {q.text}
                      {q.reverse && <span className="ml-1 text-xs text-brand">(reversed)</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section title="2. Derived traits" id="traits">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <b>Attachment style</b>: anxious if e2 ≥ 4 and e2 &gt; e4; avoidant if e4 ≥ 4 and e4 ≥ e2; secure if mean(e1, e3, e5) ≥ 3.5; else mixed.
            </li>
            <li>
              <b>Social energy</b>: mean(l1, 6 − l5) ≥ 4 extrovert, ≤ 2.5 introvert, else ambivert.
            </li>
            <li>
              <b>Planning style</b>: mean(l2, 6 − l4) ≥ 3.5 planner, ≤ 2.5 spontaneous, else balanced.
            </li>
            <li>
              <b>Conflict style</b>: avoidant if c5 ≥ 4; collaborative if mean(c2, c4) ≥ 3.5; direct if c1 ≥ 4; else measured.
            </li>
            <li>
              <b>Affection style</b>: physical, quality time or gestures depending on which of i1, i2, i5 leads with a score ≥ 4; else balanced.
            </li>
          </ul>
        </Section>

        <Section title="3. Eligibility rules" id="eligibility">
          <p>All six must pass. Any failure makes the pair ineligible with a score of 0 and no tier. The failing rule is named in the explanation.</p>
          <Table rows={ELIGIBILITY} />
        </Section>

        <Section title="4. Dimension scoring" id="dimensions">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <b>S-01 Similarity</b>: 100 − |scoreA − scoreB| for Values, Lifestyle, Life Direction and Connection.
            </li>
            <li>
              <b>S-02 Emotional</b>: 60% similarity + 40% attachment pairing matrix.
            </li>
            <li>
              <b>S-03 Communication</b>: 60% similarity + 40% conflict-style pairing matrix.
            </li>
            <li>
              <b>S-04 Weighted composite</b>: each person rates every dimension 1–3 (nice to have, important, essential). The pair&apos;s weight is the mean
              of both ratings, normalised to sum to 1. Base score = Σ compatibility × weight.
            </li>
          </ul>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Matrix title="Attachment pairing" data={ATTACHMENT_MATRIX} />
            <Matrix title="Conflict-style pairing" data={CONFLICT_MATRIX} />
          </div>
        </Section>

        <Section title="5. Modifiers" id="modifiers">
          <p>Applied after the base score. The total is capped at ±{MODIFIER_CAP} so no single lifestyle factor can dominate the dimensions.</p>
          <Table rows={MODIFIERS} />
        </Section>

        <Section title="6. Tiers" id="tiers">
          <div className="grid gap-3 sm:grid-cols-4">
            {TIER_THRESHOLDS.map((t) => (
              <div key={t.tier} className="rounded-xl bg-bg-soft p-4 text-center">
                <div className="text-2xl font-bold">{t.min}+</div>
                <div className="mt-1 text-sm font-semibold capitalize">{t.tier}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="7. Explanations" id="explanations">
          <p>
            Every result carries a headline, a summary sentence, up to three strengths (dimensions ≥ 70), watch-outs (dimensions &lt; 70 and
            penalties ≥ 4), a per-dimension narrative chosen by band, and the full rule trail. Nothing in the explanation is generated by a
            language model; every sentence is a template bound to a rule outcome, so it is deterministic and auditable.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}

function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card mt-8 p-6 text-[0.95rem] leading-relaxed">
      <h2 className="display mb-4 text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function Table({ rows }: { rows: string[][] }) {
  return (
    <div className="mt-4 overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-line">
          {rows.map(([id, name, desc]) => (
            <tr key={id} className="align-top">
              <td className="py-2 pr-3 mono text-xs text-fg-faint whitespace-nowrap">{id}</td>
              <td className="py-2 pr-3 font-semibold whitespace-nowrap">{name}</td>
              <td className="py-2 text-fg-muted">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Matrix({ title, data }: { title: string; data: Record<string, number> }) {
  return (
    <div className="rounded-xl bg-bg-soft p-4">
      <div className="font-semibold">{title}</div>
      <ul className="mt-2 grid grid-cols-1 gap-1 text-sm text-fg-muted">
        {Object.entries(data).map(([pair, v]) => (
          <li key={pair} className="flex justify-between">
            <span>{pair.replace("+", " × ")}</span>
            <span className="font-semibold text-fg">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
