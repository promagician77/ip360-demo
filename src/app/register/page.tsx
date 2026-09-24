import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/ui";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <main className="hero-glow flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </main>
  );
}
