import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScoreRing, TempScale } from "@/components/ui";
import { DIMENSIONS, DIMENSION_KEYS } from "@/lib/assessment/questions";

const STAGES = [
  { name: "PairKnow™", status: "Built", desc: "A 45-item assessment that turns preferences and characteristics into a structured compatibility profile." },
  { name: "PairSync™", status: "Built", desc: "A rules-based matching engine and REST API that scores pairs, ranks candidates and explains every result." },
  { name: "PairNavigate™", status: "Planned", desc: "Relationship feedback and insights once two people connect." },
  { name: "PairThrive™", status: "Planned", desc: "Ongoing growth, check-ins and long-term outcome tracking." },
];

const HERO_DIMS: [string, number][] = [
  ["Core values", 100],
  ["Communication", 100],
  ["Life direction", 95],
  ["Connection", 95],
  ["Lifestyle", 90],
  ["Emotional style", 85],
];

export default function HomePage() {
  return (
    <>
      <SiteHeader variant="overlay" />
      <main>
        {/* Hero */}
        <section className="photo min-h-[min(92svh,1000px)]">
          <Image src="/images/hero.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="mx-auto flex min-h-[min(92svh,1000px)] max-w-7xl flex-col justify-end px-5 pb-16 pt-32 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:pb-24">
            <div className="fade-up max-w-2xl">
              <div className="eyebrow on-photo-muted">Intentional Pairing 360</div>
              <h1 className="display mt-5 text-[3.2rem] leading-[0.98] sm:text-[4.4rem] lg:text-[5.6rem]">
                Matches you can <span className="display-italic">explain.</span>
              </h1>
              <p className="on-photo-muted mt-6 max-w-lg text-lg leading-relaxed">
                A short assessment becomes a structured profile. Documented rules turn two profiles into a score, a temperature and a
                plain-English reason. Nothing hidden.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/demo" className="btn btn-paper btn-lg">
                  See a live match
                </Link>
                <Link href="/register" className="btn btn-outline-paper btn-lg">
                  Take the assessment
                </Link>
              </div>
            </div>

            {/* Live-result card */}
            <div className="glass fade-up mt-12 w-full max-w-sm rounded-2xl p-6 lg:mt-0" style={{ animationDelay: "160ms" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="on-photo-faint text-[0.65rem] font-semibold uppercase tracking-[0.16em]">PairSync™ result</div>
                  <div className="display mt-1 text-2xl">
                    Maya <span className="display-italic on-photo-faint">&amp;</span> Daniel
                  </div>
                </div>
                <span className="pill" style={{ background: "rgba(201,54,27,0.22)", color: "#ffb3a3", borderColor: "rgba(255,179,163,0.3)" }}>
                  Hot · Exceptional
                </span>
              </div>
              <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-5">
                <div className="rounded-full" style={{ background: "rgba(23,20,26,0.5)" }}>
                  <ScoreRingOnGlass />
                </div>
                <div className="space-y-2">
                  {HERO_DIMS.map(([label, v]) => (
                    <div key={label} className="grid grid-cols-[96px_1fr_28px] items-center gap-2 text-xs">
                      <span className="on-photo-muted truncate">{label}</span>
                      <div className="h-1.5 overflow-hidden rounded-r-sm" style={{ background: "rgba(251,247,241,0.16)" }}>
                        <div className="h-full rounded-r-sm" style={{ width: `${v}%`, background: v >= 85 ? "#f26a4b" : "#e0a052" }} />
                      </div>
                      <span className="text-right font-semibold figures">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="on-photo-muted mt-5 text-sm leading-relaxed">
                <span className="font-semibold text-[#fbf7f1]">Why:</span> same timeline on marriage and children, both secure, both repair
                quickly after conflict. Faith matters more to Daniel.
              </p>
            </div>
          </div>
        </section>

        {/* Proof strip */}
        <section className="border-b border-line">
          <div className="mx-auto grid max-w-7xl divide-y divide-line px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              ["Deterministic", "Same two profiles, same answer, every time. No model drift, no black box."],
              ["Encrypted at rest", "Assessment answers are sealed with AES-256-GCM. The matcher only ever sees the derived profile."],
              ["A partner API", "Score a pair or rank two hundred candidates over REST, with an OpenAPI 3.1 spec."],
            ].map(([t, d]) => (
              <div key={t} className="py-8 md:px-8 md:first:pl-0 md:last:pr-0">
                <div className="display text-2xl">{t}</div>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Editorial statement */}
        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <h2 className="display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              Most matching is a number nobody can argue with, because nobody can see how it was made.
            </h2>
            <div className="max-w-md text-lg leading-relaxed text-fg-muted">
              <p>
                IP360 does the opposite. Six eligibility rules, six weighted dimensions, eight bounded modifiers. Every result ships with the
                rule trail that produced it, so a person, a partner or an auditor can follow the reasoning line by line.
              </p>
              <Link href="/methodology" className="link mt-6 inline-block">
                Read the methodology
              </Link>
            </div>
          </div>
        </section>

        {/* How a match is made: photo + steps */}
        <section className="grid lg:grid-cols-2">
          <div className="photo photo-wash-bottom relative min-h-[420px] lg:min-h-[720px]">
            <Image src="/images/methodology.jpg" alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 p-8 sm:p-12">
              <div className="display-italic text-3xl sm:text-4xl">“Show your work.”</div>
              <p className="on-photo-muted mt-2 max-w-sm text-sm">The one rule every other rule has to obey.</p>
            </div>
          </div>
          <div className="flex flex-col justify-center px-5 py-16 sm:px-12 lg:px-16">
            <div className="eyebrow eyebrow-ember">How a match is made</div>
            <ol className="mt-8 divide-y divide-line">
              {[
                ["PairKnow™ assessment", "Thirty agreement items across six dimensions, plus intent, children, habits, dealbreakers and preferences. Autosaved and resumable; about eight minutes."],
                ["Structured profile", "Answers become a versioned JSON profile: six dimension scores, five derived traits, structured intent and preference weights. It is the only thing the matcher sees."],
                ["PairSync™ rules engine", "Eligibility first. Then weighted dimension scoring, bounded modifiers, a tier, and a rule-by-rule trail written in plain English."],
              ].map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[3rem_1fr] gap-4 py-7 first:pt-0 last:pb-0">
                  <span className="serif text-3xl text-ember figures">0{i + 1}</span>
                  <div>
                    <h3 className="display text-2xl">{t}</h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-fg-muted">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Read the temperature */}
        <section className="border-t border-line bg-bg-elev">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
            <div className="max-w-2xl">
              <div className="eyebrow eyebrow-ember">Read the temperature</div>
              <h2 className="display mt-4 text-4xl sm:text-5xl">Scores you can feel.</h2>
              <p className="mt-4 text-lg leading-relaxed text-fg-muted">
                A match is reported on a cold-to-hot scale, so a 93 and a 58 look as different as they are. Pairs that fail a hard rule never get
                a number at all.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <TempCard img="/images/hot.jpg" wash="photo-wash-hot" word="Hot" range="85 and above" title="Exceptional" body="Nearly every dimension lines up. Rare, and the engine says so plainly." score={93} tier="exceptional" />
              <TempCard img="/images/snow.jpg" wash="photo-wash-cold" word="Cold" range="Below 55" title="Limited" body="Eligible, but the profiles pull in different directions. Shown honestly, ranked last." score={48} tier="limited" />
              <TempCard img="/images/breaker.jpg" wash="photo-wash-breaker crack" word="Breaker" range="No score" title="Ineligible" body="A dealbreaker, an intent clash or a distance limit. The failed rule is named instead of a number." score={0} tier="ineligible" />
            </div>

            <div className="mx-auto mt-14 max-w-xl">
              <TempScale score={93} tier="exceptional" />
              <p className="mt-2 text-center text-xs text-fg-faint">The same scale sits under every result. Ticks mark the tier thresholds.</p>
            </div>
          </div>
        </section>

        {/* Six dimensions */}
        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <div className="eyebrow eyebrow-ember">Six dimensions</div>
              <h2 className="display mt-4 text-4xl sm:text-5xl">What the profile measures</h2>
              <p className="mt-4 max-w-sm text-fg-muted">
                Five items each. Two dimensions are compared by similarity alone; four blend similarity with a trait-pairing matrix, because
                some differences complement rather than clash.
              </p>
            </div>
            <ol className="divide-y divide-line">
              {DIMENSION_KEYS.map((k, i) => (
                <li key={k} className="grid gap-3 py-6 first:pt-0 last:pb-0 sm:grid-cols-[3rem_1fr_auto] sm:items-baseline">
                  <span className="serif text-xl text-fg-faint figures">0{i + 1}</span>
                  <div>
                    <h3 className="display text-2xl">{DIMENSIONS[k].label}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{DIMENSIONS[k].description}</p>
                  </div>
                  <span className="tag self-start">{DIMENSIONS[k].comparison === "blended" ? "Similarity + pairing" : "Similarity"}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Suite */}
        <section className="border-y border-line">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="display text-3xl sm:text-4xl">Four stages. Two built today.</h2>
              <p className="max-w-md text-sm text-fg-muted">PairNavigate™ and PairThrive™ plug into the same profile and event model later, without rewriting what exists.</p>
            </div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {STAGES.map((s, i) => (
                <div key={s.name} className={`bg-bg p-6 ${s.status === "Planned" ? "text-fg-faint" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="serif text-lg figures">0{i + 1}</span>
                    <span className={`tag ${s.status === "Built" ? "bg-ember-soft text-ember" : ""}`}>{s.status}</span>
                  </div>
                  <h3 className={`display mt-8 text-2xl ${s.status === "Planned" ? "" : "text-fg"}`}>{s.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="photo photo-wash-full">
          <Image src="/images/demo.jpg" alt="" fill sizes="100vw" className="object-cover" />
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-5 py-28 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h2 className="display text-4xl sm:text-5xl lg:text-6xl">See the whole journey.</h2>
              <p className="on-photo-muted mt-4 text-lg">
                Walk from assessment to ranked matches with the demo account, or compare any two of the twelve personas in public.
              </p>
              <p className="on-photo-faint mt-3 text-sm">
                Demo login <span className="mono text-[#fbf7f1]">demo@ip360.app</span> · <span className="mono text-[#fbf7f1]">Demo1234!</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/demo" className="btn btn-paper btn-lg">
                Open the live demo
              </Link>
              <Link href="/developers" className="btn btn-outline-paper btn-lg">
                API docs
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function ScoreRingOnGlass() {
  return (
    <div data-theme="dark" style={{ ["--bg-elev" as string]: "rgba(23,20,26,0.01)", ["--bg-soft" as string]: "rgba(251,247,241,0.16)", ["--fg" as string]: "#fbf7f1", ["--fg-faint" as string]: "rgba(251,247,241,0.5)" }}>
      <ScoreRing score={93} tier="exceptional" size={110} stroke={10} degree label="temp" />
    </div>
  );
}

function TempCard({ img, wash, word, range, title, body, score, tier }: { img: string; wash: string; word: string; range: string; title: string; body: string; score: number; tier: "exceptional" | "limited" | "ineligible" }) {
  return (
    <div className={`photo ${wash} card-lift flex min-h-[380px] flex-col justify-between rounded-2xl p-6`}>
      <Image src={img} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover" />
      <div className="flex items-start justify-between">
        <div>
          <div className="display text-3xl">{word}</div>
          <div className="on-photo-faint mt-1 text-xs font-semibold uppercase tracking-[0.14em]">{range}</div>
        </div>
        <div style={{ ["--bg-elev" as string]: "rgba(0,0,0,0)", ["--bg-soft" as string]: "rgba(251,247,241,0.18)", ["--fg" as string]: "#fbf7f1", ["--fg-faint" as string]: "rgba(251,247,241,0.5)" }}>
          <ScoreRing score={score} tier={tier} size={72} stroke={7} />
        </div>
      </div>
      <div>
        <div className="text-lg font-semibold">{title}</div>
        <p className="on-photo-muted mt-1 text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
