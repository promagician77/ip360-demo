import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DemoJourney } from "@/components/DemoJourney";

export const metadata = { title: "Live demo" };

export default function DemoPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8">
          <div className="eyebrow mb-2">Assessment → profile → match</div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">See PairSync™ explain a match</h1>
          <p className="mt-2 max-w-2xl text-fg-muted">
            Every persona below completed the full PairKnow™ assessment. Pick two and the engine runs its eligibility rules, weighted
            scoring and modifiers in real time, then shows you exactly why the result is what it is.
          </p>
        </div>
        <DemoJourney />
      </main>
      <SiteFooter />
    </>
  );
}
