"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Spinner } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app";
  const [email, setEmail] = useState(mode === "login" ? "demo@ip360.app" : "");
  const [password, setPassword] = useState(mode === "login" ? "Demo1234!" : "");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(mode === "login" ? { email, password } : { email, password, displayName }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data?.error?.message ?? "Something went wrong.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md">
      <h1 className="display text-4xl">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-2 text-sm text-fg-muted">
        {mode === "login" ? "Sign in to continue your PairKnow™ journey." : "It takes about eight minutes to complete the assessment."}
      </p>

      <div className="mt-8 space-y-4">
        {mode === "register" && (
          <div>
            <label className="label" htmlFor="displayName">
              First name
            </label>
            <input id="displayName" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={40} autoComplete="given-name" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {mode === "register" && <p className="mt-1 text-xs text-fg-faint">At least 8 characters with a letter and a number.</p>}
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg border border-ember/30 bg-ember-soft px-3 py-2 text-sm text-ember">{error}</div>}

      <button className="btn btn-primary mt-6 w-full" disabled={busy}>
        {busy && <Spinner />}
        {mode === "login" ? "Sign in" : "Create account"}
      </button>

      {mode === "login" && (
        <div className="mt-4 rounded-lg border border-line bg-bg-soft/60 p-3 text-xs text-fg-muted">
          Demo credentials are pre-filled: <span className="mono text-fg">demo@ip360.app</span> / <span className="mono text-fg">Demo1234!</span>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-fg-muted">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/register" className="link">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="link">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
