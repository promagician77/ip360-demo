import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { Logo } from "./ui";
import { LogoutButton } from "./LogoutButton";

const NAV = [
  { href: "/demo", label: "Live demo" },
  { href: "/developers", label: "API" },
  { href: "/methodology", label: "Methodology" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-fg-muted md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-fg">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/app" className="btn btn-secondary btn-sm">
                My dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Sign in
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Take the assessment
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
