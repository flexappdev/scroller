import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight mb-3">Authentication error</h1>
        <p className="text-sm text-zinc-400 mb-5">
          Scroller admin is restricted to <code className="font-mono text-emerald-400">mat@matsiems.com</code>. If you believe this is wrong, double-check the email you signed in with.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
