"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth/session";
import { Avatar, Logo } from "./ui";
import { LogoutButton } from "./LogoutButton";

const NAV = [
  { href: "/app", label: "Overview", icon: "M3 12l9-8 9 8v8a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z" },
  { href: "/app/assessment", label: "Assessment", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
  { href: "/app/profile", label: "My profile", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { href: "/app/matches", label: "Matches", icon: "M12 21s-7-4.4-9.3-8.6C.9 9 2.6 5 6.5 5c2 0 3.4 1.1 4.2 2.3C11.9 6.1 13.3 5 15.3 5c3.9 0 5.6 4 3.8 7.4C19 16.6 12 21 12 21z" },
];

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const nav = user.role === "admin" ? [...NAV, { href: "/app/admin", label: "Admin", icon: "M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" }] : NAV;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-bg md:flex">
        <div className="px-6 py-6">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((n) => {
            const active = n.href === "/app" ? pathname === "/app" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-ink text-paper" : "text-fg-muted hover:bg-bg-soft hover:text-fg"}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={n.icon} />
                </svg>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line p-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.displayName || user.email} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{user.displayName}</div>
              <div className="truncate text-xs text-fg-faint">{user.email}</div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link href="/demo" className="btn btn-ghost btn-sm flex-1">
              Public demo
            </Link>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-line bg-bg-elev px-4 md:hidden">
          <Logo />
          <LogoutButton />
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-line bg-bg-elev px-2 py-2 md:hidden">
          {nav.map((n) => {
            const active = n.href === "/app" ? pathname === "/app" : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${active ? "bg-ink text-paper" : "text-fg-muted"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
