import type { Metadata } from "next";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

/** Fraunces (variable, optical size + weight) for display type. Local files: no runtime font fetch. */
const fraunces = localFont({
  src: [
    { path: "../fonts/fraunces-normal.woff2", style: "normal", weight: "300 700" },
    { path: "../fonts/fraunces-italic.woff2", style: "italic", weight: "300 700" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "IP360 · Intentional Pairing",
    template: "%s · IP360",
  },
  description:
    "Relationship-intelligence prototype: PairKnow™ assessment, structured compatibility profiles and the PairSync™ rules-based matching API.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
