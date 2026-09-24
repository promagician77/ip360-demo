import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { AuthLayout } from "@/components/AuthLayout";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthLayout quote="Compatibility is a conversation, not a coincidence." sub="Sign in to continue your PairKnow™ assessment and see how your matches read today.">
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthLayout>
  );
}
