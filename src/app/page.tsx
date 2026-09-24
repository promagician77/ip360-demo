import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DIMENSIONS, DIMENSION_KEYS } from "@/lib/assessment/questions";

const STAGES = [
  { name: "PairKnow™", status: "In this prototype", desc: "A 45-item assessment that turns preferences and characteristics into a structured compatibility profile.", tone: "brand" },
  { name: "PairSync™", status: "In this prototype", desc: "A rules-based matching engine and REST API that scores pairs, ranks candidates and explains every result.", tone: "brand" },
  { name: "PairNavigate™", status: "Planned", desc: "Relationship feedback and insights once two people connect.", tone: "muted" },
  { name: "PairThrive™", status: "Planned", desc: "Ongoing growth, check-ins and long-term outcome tracking.", tone: "muted" },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="hero-glow">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
            <div className="fade-up">
              <div className="eyebrow mb-4">Relationship intelligence for dating platforms</div>
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Matches you can <span className="gradient-text">explain.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-fg-muted">
                IP360 turns a short assessment into a structured compatibility profile, then applies documented matching rules to
                produce a score, a tier and a plain-English explanation of why two people fit.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/demo" className="btn btn-primary">
                  See a live match
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
                <Link href="/register" className="btn btn-secondary">
                  Take the assessment
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-fg-muted">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sage" /> Deterministic rules, no black box
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sage" /> Answers encrypted at rest
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sage" /> Partner REST API
                </span>
              </div>
            </div>

            {/* Hero visual */}
            <div className="fade-up relative" style={{ animationDelay: "120ms" }}>
              <div className="card p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-fg-faint">PairSync™ result</div>
                    <div className="mt-1 text-xl font-bold">Maya × Daniel</div>
                  </div>
                  <span className="pill" style={{ background: "color-mix(in srgb, var(--tier-exceptional) 14%, transparent)", color: "var(--tier-exceptional)" }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--tier-exceptional)" }} />
                    Exceptional match
                  </span>
                </div>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-6xl font-bold leading-none tracking-tight">93</span>
                  <span className="mb-1 text-fg-muted">/ 100</span>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    ["Core Values", 100, "var(--tier-exceptional)"],
                    ["Communication", 100, "var(--tier-exceptional)"],
                    ["Life Direction", 95, "var(--tier-exceptional)"],
                    ["Connection", 95, "var(--tier-exceptional)"],
                    ["Lifestyle", 90, "var(--tier-exceptional)"],
                    ["Emotional Style", 85, "var(--tier-strong)"],
                  ].map(([label, v, color]) => (
                    <div key={label as string} className="grid grid-cols-[110px_1fr_32px] items-center gap-3 text-sm">
                      <span className="text-fg-muted">{label}</span>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-bg-soft">
                        <div className="h-full rounded-full" style={{ width: `${v}%`, background: color as string }} />
                      </div>
                      <span className="text-right font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl bg-bg-soft p-4 text-sm leading-relaxed text-fg-muted">
                  <span className="font-semibold text-fg">Why:</span> both want marriage and children on the same timeline, both bring a secure
                  attachment style, and both repair quickly after conflict. Watch-out: faith matters more to Daniel than to Maya.
                </div>
              </div>
              <div className="absolute -right-4 -top-4 -z-10 h-40 w-40 rounded-full bg-brand-soft blur-3xl" />
              <div className="absolute -bottom-6 -left-6 -z-10 h-40 w-40 rounded-full bg-plum-soft blur-3xl" />
            </div>
          </div>
        </section>

        {/* Product suite */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="eyebrow mb-3">The IP360 suite</div>
          <h2 className="text-3xl font-bold tracking-tight">Four stages. Two built today.</h2>
          <p className="mt-3 max-w-2xl text-fg-muted">
            The architecture is designed so PairNavigate™ and PairThrive™ plug into the same profile and event model later, without
            rewriting what exists.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((s, i) => (
              <div key={s.name} className={`card card-lift p-5 ${s.tone === "muted" ? "opacity-75" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-plum-soft text-sm font-bold text-plum">{i + 1}</span>
                  <span className={`pill ${s.tone === "brand" ? "bg-sage-soft text-sage" : "bg-bg-soft text-fg-faint"}`}>{s.status}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.name}</h3>
                <p className="mt-1 text-sm text-fg-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-line bg-bg-soft/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="eyebrow mb-3">Assessment to match</div>
            <h2 className="text-3xl font-bold tracking-tight">How a match is made</h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "PairKnow™ assessment",
                  body: "30 agreement items across six dimensions, plus intent, children, habits, dealbreakers and preferences. Autosaved, resumable, encrypted at rest.",
                },
                {
                  step: "02",
                  title: "Structured profile",
                  body: "Answers become a versioned JSON profile: six dimension scores, five derived traits, structured intent and preference weights. This is the only thing the matcher ever sees.",
                },
                {
                  step: "03",
                  title: "PairSync™ rules engine",
                  body: "Six eligibility rules, weighted dimension scoring, eight bounded modifiers, a tier, and a rule-by-rule trail that explains the result in plain English.",
                },
              ].map((s) => (
                <div key={s.step} className="card p-6">
                  <div className="mono text-sm font-bold text-brand">{s.step}</div>
                  <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dimensions */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="eyebrow mb-3">Six compatibility dimensions</div>
          <h2 className="text-3xl font-bold tracking-tight">What the profile measures</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DIMENSION_KEYS.map((k) => (
              <div key={k} className="card card-lift p-5">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-brand to-coral" />
                  <h3 className="font-semibold">{DIMENSIONS[k].label}</h3>
                </div>
                <p className="mt-2 text-sm text-fg-muted">{DIMENSIONS[k].description}</p>
                <p className="mt-3 text-xs text-fg-faint">
                  Compared by {DIMENSIONS[k].comparison === "blended" ? "similarity + trait pairing" : "similarity"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="card relative overflow-hidden p-8 sm:p-12">
            <div className="absolute inset-0 -z-0 hero-glow" />
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Ready to see the whole journey?</h2>
                <p className="mt-2 max-w-xl text-fg-muted">
                  Sign in with the demo account to walk from assessment to ranked matches, or explore the public demo with twelve seeded
                  personas.
                </p>
                <p className="mt-3 text-sm text-fg-faint">
                  Demo login: <span className="mono text-fg">demo@ip360.app</span> · <span className="mono text-fg">Demo1234!</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/login" className="btn btn-primary">
                  Sign in to demo
                </Link>
                <Link href="/developers" className="btn btn-secondary">
                  API docs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
