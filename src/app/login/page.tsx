"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ERROR_LABELS: Record<string, string> = {
  unauthorized: "This account is not authorized.",
  auth: "Sign in failed. Please try again.",
};

const ALLOWED_EMAIL = "mat@matsiems.com";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialError = ERROR_LABELS[params.get("error") ?? ""] ?? "";
  const [email] = useState(ALLOWED_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      const next = params.get("next") ?? "/admin";
      router.push(next.startsWith("/") ? next : "/admin");
      router.refresh();
    } catch {
      setError("Unable to reach the auth service. Check your connection and try again.");
      setLoading(false);
    }
  }

  function handleDevLogin() {
    document.cookie = "scroller-dev-bypass=1; path=/; max-age=86400";
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-950/60 p-7">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-3 text-zinc-100 hover:text-emerald-400 transition-colors">
            <Smartphone className="h-5 w-5 text-emerald-500" />
            <span className="font-bold tracking-tight text-base">Scroller</span>
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
          <p className="text-xs text-zinc-500 mt-1">Editor access to the admin console</p>
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Email
            <input
              type="email"
              value={email}
              readOnly
              disabled
              aria-readonly="true"
              autoComplete="email"
              className="rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-500 cursor-not-allowed"
            />
            <span className="text-[11px] text-zinc-500 mt-0.5">
              Single-editor cockpit. To switch editors, change <code className="font-mono text-emerald-400">ALLOWED_EMAILS</code> in <code className="font-mono text-emerald-400">src/lib/supabase/middleware.ts</code>.
            </span>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-600"
            />
          </label>
          {error && (
            <p className="text-xs text-red-400" role="alert">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 pt-3 border-t border-zinc-800">
            <button
              onClick={handleDevLogin}
              className="w-full rounded-md border border-dashed border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-colors"
              type="button"
            >
              Dev login (skip auth — local only)
            </button>
          </div>
        )}
        <div className="mt-4 text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-sm text-zinc-500">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
