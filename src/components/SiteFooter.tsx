import Link from "next/link";

const COLS = [
  { title: "Product", links: [["/demo", "Live demo"], ["/register", "Take the assessment"], ["/login", "Sign in"]] },
  { title: "Engine", links: [["/methodology", "Methodology"], ["/developers", "API reference"], ["/api/v1/openapi.json", "OpenAPI spec"]] },
  { title: "Status", links: [["/api/v1/health", "Service health"]] },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-bg">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="display text-3xl">
              IP<span className="text-ember">360</span>
              <span className="ml-1 align-top text-xs text-fg-faint">™</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-fg-muted">
              Intentional Pairing 360. An assessment that becomes a profile, and a matching engine that shows its work.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <div className="eyebrow">{c.title}</div>
              <ul className="mt-4 space-y-2.5 text-sm">
                {c.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-fg-muted hover:text-fg">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-fg-faint sm:flex-row sm:items-center sm:justify-between">
          <span>PairKnow™ · PairSync™ · PairNavigate™ · PairThrive™</span>
          <span>Prototype build. Photography via Unsplash.</span>
        </div>
      </div>
    </footer>
  );
}
