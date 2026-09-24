import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { Logo } from "@/components/ui";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="hero-glow flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
