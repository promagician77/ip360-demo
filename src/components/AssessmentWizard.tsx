"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DIMENSIONS,
  DIMENSION_KEYS,
  LIKERT_LABELS,
  STRUCTURED_QUESTIONS,
  WEIGHT_OPTIONS,
  likertByDimension,
  type ChoiceQuestion,
  type DimensionKey,
  type MultiChoiceQuestion,
  type NumberQuestion,
  type Question,
  type ScaleQuestion,
  type TextQuestion,
} from "@/lib/assessment/questions";
import { KNOWN_CITIES } from "@/lib/server/geocode";
import { Bar, Spinner } from "./ui";

type Answers = Record<string, unknown>;

interface Step {
  id: string;
  title: string;
  subtitle: string;
  kind: "structured" | "likert" | "weights" | "review";
  section?: "about" | "intent" | "lifestyle" | "preferences";
  dimension?: DimensionKey;
}

const STEPS: Step[] = [
  { id: "about", title: "About you", subtitle: "The basics we need to find people near you.", kind: "structured", section: "about" },
  { id: "intent", title: "What you're looking for", subtitle: "These answers shape eligibility, not just scoring.", kind: "structured", section: "intent" },
  { id: "habits", title: "Lifestyle habits", subtitle: "Honest answers make better matches.", kind: "structured", section: "lifestyle" },
  ...DIMENSION_KEYS.map<Step>((k) => ({ id: k, title: DIMENSIONS[k].label, subtitle: DIMENSIONS[k].description, kind: "likert", dimension: k })),
  { id: "weights", title: "What matters most", subtitle: "Tell us how much each dimension should count when we match you.", kind: "weights" },
  { id: "preferences", title: "Preferences & dealbreakers", subtitle: "Who you'd like to meet, and what rules someone out entirely.", kind: "structured", section: "preferences" },
  { id: "review", title: "Review & submit", subtitle: "One last look before we generate your profile.", kind: "review" },
];

function stepComplete(step: Step, a: Answers): boolean {
  if (step.kind === "structured") {
    return STRUCTURED_QUESTIONS.filter((q) => q.section === step.section).every((q) => {
      if (q.type === "text" && q.optional) return true;
      const v = a[q.id];
      if (q.type === "multi") return Array.isArray(v) && v.length >= (q.min ?? 0);
      if (q.type === "text") return typeof v === "string" && v.trim().length > 0;
      return v !== undefined && v !== null && v !== "";
    });
  }
  if (step.kind === "likert") {
    const likert = (a.likert as Record<string, number>) ?? {};
    return likertByDimension(step.dimension!).every((q) => typeof likert[q.id] === "number");
  }
  if (step.kind === "weights") {
    const w = (a.weights as Record<string, number>) ?? {};
    return DIMENSION_KEYS.every((k) => [1, 2, 3].includes(w[k]));
  }
  return true;
}

function toResponses(a: Answers) {
  return {
    displayName: a.displayName,
    age: Number(a.age),
    gender: a.gender,
    city: a.city,
    bio: a.bio || undefined,
    intent: a.intent,
    children: a.children,
    relocation: a.relocation,
    faithImportance: Number(a.faithImportance),
    smoking: a.smoking,
    drinking: a.drinking,
    seeking: a.seeking,
    ageMin: Number(a.ageMin),
    ageMax: Number(a.ageMax),
    maxDistanceKm: Number(a.maxDistanceKm),
    dealbreakers: a.dealbreakers ?? [],
    weights: a.weights,
    likert: a.likert,
  };
}

export function AssessmentWizard({ retake }: { retake: boolean }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"not_started" | "in_progress" | "completed">("not_started");
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  // Load existing state
  useEffect(() => {
    fetch("/api/assessment")
      .then((r) => r.json())
      .then((s) => {
        setStatus(s.status);
        if (s.status === "in_progress" || (s.status === "completed" && retake)) {
          setAnswers(s.answers ?? {});
          setStep(s.status === "completed" ? 0 : Math.min(s.step ?? 0, STEPS.length - 1));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [retake]);

  // Debounced autosave
  const scheduleSave = useCallback((next: Answers, nextStep: number) => {
    dirty.current = true;
    setSaving("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fetch("/api/assessment", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers: next, step: nextStep }) });
        setSaving("saved");
      } catch {
        setSaving("idle");
      }
    }, 700);
  }, []);

  const update = useCallback(
    (patch: Answers) => {
      setAnswers((prev) => {
        const next = { ...prev, ...patch };
        scheduleSave(next, step);
        return next;
      });
    },
    [scheduleSave, step],
  );

  const setLikert = (id: string, v: number) => update({ likert: { ...((answers.likert as Record<string, number>) ?? {}), [id]: v } });
  const setWeight = (k: DimensionKey, v: number) => update({ weights: { ...((answers.weights as Record<string, number>) ?? {}), [k]: v } });

  const current = STEPS[step];
  const canContinue = stepComplete(current, answers);
  const completedSteps = STEPS.filter((s) => s.kind !== "review" && stepComplete(s, answers)).length;
  const progress = (completedSteps / (STEPS.length - 1)) * 100;
  const allComplete = STEPS.every((s) => stepComplete(s, answers));

  const go = (n: number) => {
    const clamped = Math.max(0, Math.min(STEPS.length - 1, n));
    setStep(clamped);
    scheduleSave(answers, clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function submit() {
    setSubmitting(true);
    setError(null);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const res = await fetch("/api/assessment/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(toResponses(answers)) });
    const data = await res.json();
    if (!res.ok) {
      setSubmitting(false);
      const details = data?.error?.details as { path: string; message: string }[] | undefined;
      setError(details?.length ? details.map((d) => `${d.path}: ${d.message}`).join(" · ") : data?.error?.message ?? "Submission failed.");
      return;
    }
    router.push("/app/profile?new=1");
    router.refresh();
  }

  const structuredQuestions = useMemo(() => (current.section ? STRUCTURED_QUESTIONS.filter((q) => q.section === current.section) : []), [current]);

  if (!loaded) {
    return (
      <div className="flex items-center gap-3 text-fg-muted">
        <Spinner /> Loading your assessment…
      </div>
    );
  }

  if (status === "completed" && !retake) {
    return (
      <div className="card p-8">
        <div className="eyebrow mb-2">PairKnow™</div>
        <h1 className="text-2xl font-bold tracking-tight">You&apos;ve already completed the assessment</h1>
        <p className="mt-2 text-fg-muted">Your compatibility profile is live and being used for matching. You can retake it at any time; your profile and matches will be regenerated.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app/profile" className="btn btn-primary">
            View my profile
          </Link>
          <Link href="/app/assessment?retake=1" className="btn btn-secondary">
            Retake assessment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      {/* Step rail */}
      <aside className="hidden lg:block">
        <div className="sticky top-8">
          <div className="eyebrow mb-3">PairKnow™</div>
          <ol className="space-y-1">
            {STEPS.map((s, i) => {
              const done = s.kind !== "review" && stepComplete(s, answers);
              const active = i === step;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => go(i)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition ${active ? "bg-brand-soft font-semibold text-brand-strong" : "text-fg-muted hover:text-fg"}`}
                  >
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.65rem] font-bold ${done ? "bg-sage text-white" : active ? "bg-brand text-white" : "bg-bg-soft text-fg-faint"}`}>
                      {done ? "✓" : i + 1}
                    </span>
                    <span className="truncate">{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </aside>

      <div>
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-fg-muted">
            <span>
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="inline-flex items-center gap-1.5">
              {saving === "saving" && (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-gold pulse-soft" /> Saving…
                </>
              )}
              {saving === "saved" && (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-sage" /> Saved
                </>
              )}
            </span>
          </div>
          <div className="mt-2">
            <Bar value={progress} height={6} />
          </div>
        </div>

        <div key={current.id} className="card fade-up p-6 sm:p-8">
          <div className="eyebrow mb-2">{current.kind === "likert" ? "Dimension" : "Section"}</div>
          <h1 className="text-2xl font-bold tracking-tight">{current.title}</h1>
          <p className="mt-1 text-fg-muted">{current.subtitle}</p>

          <div className="mt-8 space-y-8">
            {current.kind === "structured" && structuredQuestions.map((q) => <StructuredField key={q.id} q={q} answers={answers} update={update} />)}

            {current.kind === "likert" &&
              likertByDimension(current.dimension!).map((q, i) => {
                const v = ((answers.likert as Record<string, number>) ?? {})[q.id];
                return (
                  <div key={q.id}>
                    <p className="text-[1.02rem] font-medium">
                      <span className="mr-2 text-fg-faint">{i + 1}.</span>
                      {q.text}
                    </p>
                    <div className="likert mt-3" role="radiogroup" aria-label={q.text}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" role="radio" aria-checked={v === n} data-active={v === n} className="likert-opt" onClick={() => setLikert(q.id, n)}>
                          <span className="likert-dot">{n}</span>
                          <span className="hidden sm:block">{LIKERT_LABELS[n]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

            {current.kind === "weights" &&
              DIMENSION_KEYS.map((k) => {
                const v = ((answers.weights as Record<string, number>) ?? {})[k];
                return (
                  <div key={k}>
                    <p className="font-medium">{DIMENSIONS[k].label}</p>
                    <p className="text-sm text-fg-muted">{DIMENSIONS[k].description}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {WEIGHT_OPTIONS.map((o) => (
                        <button key={o.value} type="button" data-active={v === Number(o.value)} className="choice justify-center text-sm font-semibold" onClick={() => setWeight(k, Number(o.value))}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

            {current.kind === "review" && <Review answers={answers} />}
          </div>

          {error && <div className="mt-6 rounded-xl border border-red-200 bg-rose-soft px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:text-red-300">{error}</div>}

          <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
            <button className="btn btn-ghost" onClick={() => go(step - 1)} disabled={step === 0}>
              Back
            </button>
            {current.kind === "review" ? (
              <button className="btn btn-primary" onClick={submit} disabled={!allComplete || submitting}>
                {submitting && <Spinner />}
                Generate my profile
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => go(step + 1)} disabled={!canContinue}>
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Field renderers ----------------------------- */

function StructuredField({ q, answers, update }: { q: Question; answers: Answers; update: (p: Answers) => void }) {
  const v = answers[q.id];
  if (q.type === "likert") return null;

  return (
    <div>
      <label className="block text-[1.02rem] font-medium" htmlFor={q.id}>
        {q.text}
        {"optional" in q && q.optional && <span className="ml-2 text-xs font-normal text-fg-faint">optional</span>}
      </label>
      {q.help && <p className="mt-1 text-sm text-fg-muted">{q.help}</p>}
      <div className="mt-3">
        {q.type === "text" && <TextField q={q} value={(v as string) ?? ""} onChange={(x) => update({ [q.id]: x })} />}
        {q.type === "number" && <NumberField q={q} value={v as number | undefined} onChange={(x) => update({ [q.id]: x })} />}
        {q.type === "scale" && <ScaleField q={q} value={v as number | undefined} onChange={(x) => update({ [q.id]: x })} />}
        {q.type === "choice" && <ChoiceField q={q} value={v as string | undefined} onChange={(x) => update({ [q.id]: x })} />}
        {q.type === "multi" && <MultiField q={q} value={(v as string[]) ?? []} onChange={(x) => update({ [q.id]: x })} />}
      </div>
    </div>
  );
}

function TextField({ q, value, onChange }: { q: TextQuestion; value: string; onChange: (v: string) => void }) {
  if (q.id === "city") {
    return (
      <>
        <input id={q.id} className="input" list="city-list" value={value} onChange={(e) => onChange(e.target.value)} maxLength={q.maxLength} placeholder="Austin, TX" />
        <datalist id="city-list">
          {KNOWN_CITIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <p className="mt-1 text-xs text-fg-faint">Prototype geocoder recognises major cities; unknown cities default to Austin, TX.</p>
      </>
    );
  }
  return <input id={q.id} className="input" value={value} onChange={(e) => onChange(e.target.value)} maxLength={q.maxLength} />;
}

function NumberField({ q, value, onChange }: { q: NumberQuestion; value?: number; onChange: (v: number | undefined) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input
        id={q.id}
        type="number"
        className="input max-w-[160px]"
        min={q.min}
        max={q.max}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
      {q.unit && <span className="text-sm text-fg-muted">{q.unit}</span>}
    </div>
  );
}

function ScaleField({ q, value, onChange }: { q: ScaleQuestion; value?: number; onChange: (v: number) => void }) {
  const opts = Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i);
  return (
    <div>
      <div className="likert">
        {opts.map((n) => (
          <button key={n} type="button" data-active={value === n} className="likert-opt" onClick={() => onChange(n)}>
            <span className="likert-dot">{n}</span>
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-fg-faint">
        <span>{q.minLabel}</span>
        <span>{q.maxLabel}</span>
      </div>
    </div>
  );
}

function ChoiceField({ q, value, onChange }: { q: ChoiceQuestion; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {q.options.map((o) => (
        <button key={o.value} type="button" data-active={value === o.value} className="choice" onClick={() => onChange(o.value)}>
          <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${value === o.value ? "border-brand" : "border-line-strong"}`}>
            {value === o.value && <span className="h-2 w-2 rounded-full bg-brand" />}
          </span>
          <span>
            <span className="block text-sm font-semibold">{o.label}</span>
            {o.description && <span className="block text-xs text-fg-muted">{o.description}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

function MultiField({ q, value, onChange }: { q: MultiChoiceQuestion; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {q.options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button key={o.value} type="button" data-active={on} className="choice" onClick={() => toggle(o.value)}>
            <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border-2 ${on ? "border-brand bg-brand text-white" : "border-line-strong"}`}>
              {on && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span>
              <span className="block text-sm font-semibold">{o.label}</span>
              {o.description && <span className="block text-xs text-fg-muted">{o.description}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Review({ answers }: { answers: Answers }) {
  const likert = (answers.likert as Record<string, number>) ?? {};
  const weights = (answers.weights as Record<string, number>) ?? {};
  const label = (q: Question, v: unknown) => {
    if (q.type === "choice") return q.options.find((o) => o.value === v)?.label ?? "—";
    if (q.type === "multi") return Array.isArray(v) && v.length ? v.map((x) => q.options.find((o) => o.value === x)?.label ?? x).join(", ") : "None";
    return v === undefined || v === "" ? "—" : String(v);
  };
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {STRUCTURED_QUESTIONS.map((q) => (
          <div key={q.id} className="rounded-xl bg-bg-soft px-4 py-3">
            <div className="text-xs text-fg-muted">{q.text}</div>
            <div className="mt-0.5 text-sm font-semibold">{label(q, answers[q.id])}</div>
          </div>
        ))}
      </div>
      <div>
        <h3 className="font-semibold">Dimension answers</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DIMENSION_KEYS.map((k) => {
            const qs = likertByDimension(k);
            const done = qs.filter((q) => likert[q.id]).length;
            return (
              <div key={k} className="rounded-xl bg-bg-soft px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{DIMENSIONS[k].label}</span>
                  <span className={`text-xs font-semibold ${done === qs.length ? "text-sage" : "text-gold"}`}>
                    {done}/{qs.length}
                  </span>
                </div>
                <div className="mt-1 text-xs text-fg-muted">Weight: {WEIGHT_OPTIONS.find((o) => Number(o.value) === weights[k])?.label ?? "—"}</div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-sm text-fg-muted">
        Submitting encrypts your answers, generates your compatibility profile and runs the PairSync™ engine against the current pool.
      </p>
    </div>
  );
}
