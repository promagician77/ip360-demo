import Image from "next/image";
import type { ReactNode } from "react";
import { Logo } from "./ui";

/** Split auth screen: photo with a line of copy on the left, form on the right. */
export function AuthLayout({ children, quote, sub }: { children: ReactNode; quote: string; sub: string }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="photo photo-wash-bottom relative hidden lg:block">
        <Image src="/images/auth.jpg" alt="" fill priority sizes="55vw" className="object-cover" />
        <div className="absolute left-10 top-8">
          <Logo onPhoto />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="display-italic max-w-md text-4xl leading-tight">{quote}</p>
          <p className="on-photo-muted mt-3 max-w-sm text-sm">{sub}</p>
        </div>
      </section>
      <section className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </section>
    </main>
  );
}
