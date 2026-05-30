"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, Home } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[scroller/admin/error]", error);
  }, [error]);

  return (
    <div className="px-6 py-12 max-w-2xl mx-auto space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-3">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500 font-mono">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          Admin console error
        </div>
        <h1 className="text-xl font-semibold text-zinc-100">The admin console couldn&apos;t load.</h1>
        <p className="text-sm text-zinc-400">
          Likely cause: Supabase outage, missing service-role key, or a migration not yet applied.
          The public site is unaffected.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-zinc-600">digest: {error.digest}</p>
        )}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-md border border-emerald-700/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300 hover:border-emerald-500 hover:text-emerald-200 transition-colors"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Retry
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 hover:border-zinc-500 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            Public site
          </Link>
        </div>
      </div>
    </div>
  );
}
