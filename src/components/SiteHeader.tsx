import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { Logo } from "./ui";
import { LogoutButton } from "./LogoutButton";

const NAV = [
  { href: "/demo", label: "Live demo" },
  { href: "/developers", label: "API" },
  { href: "/methodology", label: "Methodology" },
];

/**
 * `overlay` sits transparently on top of a photo hero (paper-coloured text);
 * `solid` is the sticky paper header used everywhere else.
 */
export async function SiteHeader({ variant = "solid" }: { variant?: "solid" | "overlay" }) {
  const user = await getCurrentUser();
  const overlay = variant === "overlay";
  return (
    <header className={overlay ? "absolute inset-x-0 top-0 z-40" : "sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur"}>
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-10">
          <Logo onPhoto={overlay} />
          <nav className={`hidden items-center gap-7 text-[0.9rem] font-medium md:flex ${overlay ? "on-photo-muted" : "text-fg-muted"}`}>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={overlay ? "hover:text-[#fbf7f1]" : "hover:text-fg"}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/app" className={`btn btn-sm ${overlay ? "btn-outline-paper" : "btn-secondary"}`}>
                My dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className={`btn btn-sm ${overlay ? "btn-outline-paper" : "btn-ghost"}`}>
                Sign in
              </Link>
              <Link href="/register" className={`btn btn-sm ${overlay ? "btn-paper" : "btn-primary"}`}>
                Take the assessment
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
