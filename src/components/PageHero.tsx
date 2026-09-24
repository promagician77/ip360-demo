import Image from "next/image";
import type { ReactNode } from "react";

/** Compact photo banner for inner pages. */
export function PageHero({ img, eyebrow, title, children, wash = "" }: { img: string; eyebrow: string; title: ReactNode; children?: ReactNode; wash?: string }) {
  return (
    <section className={`photo ${wash}`}>
      <Image src={img} alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="mx-auto max-w-7xl px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
        <div className="eyebrow on-photo-muted">{eyebrow}</div>
        <h1 className="display mt-4 max-w-3xl text-4xl sm:text-5xl lg:text-6xl">{title}</h1>
        {children && <div className="on-photo-muted mt-5 max-w-2xl text-lg leading-relaxed">{children}</div>}
      </div>
    </section>
  );
}
