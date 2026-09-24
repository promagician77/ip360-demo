import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <span className="font-semibold text-fg">Intentional Pairing 360™</span> · PairKnow™ + PairSync™ prototype
        </div>
        <nav className="flex flex-wrap gap-5">
          <Link href="/demo" className="hover:text-fg">
            Demo
          </Link>
          <Link href="/developers" className="hover:text-fg">
            API docs
          </Link>
          <Link href="/methodology" className="hover:text-fg">
            Methodology
          </Link>
          <a href="/api/v1/health" className="hover:text-fg">
            Status
          </a>
        </nav>
      </div>
    </footer>
  );
}
