import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DemoJourney } from "@/components/DemoJourney";
import { PageHero } from "@/components/PageHero";

export const metadata = { title: "Live demo" };

export default function DemoPage() {
  return (
    <>
      <SiteHeader />
      <PageHero img="/images/demo.jpg" eyebrow="Assessment → profile → match" title={<>Watch PairSync™ <span className="display-italic">explain</span> a match.</>}>
        Every persona completed the full PairKnow™ assessment. Pick two and the engine runs its eligibility rules, weighted scoring and
        modifiers in real time, then shows exactly why the result is what it is.
      </PageHero>
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8">
        <DemoJourney />
      </main>
      <SiteFooter />
    </>
  );
}
