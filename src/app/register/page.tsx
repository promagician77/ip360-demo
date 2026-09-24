import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { AuthLayout } from "@/components/AuthLayout";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthLayout quote="Eight minutes now. A clearer answer later." sub="Thirty short items, a few structured questions, your dealbreakers. Saved as you go.">
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </AuthLayout>
  );
}
