import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export const metadata = {
  title: "Item not found",
  description: "We couldn't resolve this item — it may have been removed or the link is malformed.",
};

export default function ItemNotFound() {
  return (
    <div className="px-6 py-16 max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500 font-mono">
          <Search className="h-3.5 w-3.5 text-zinc-500" />
          Item · 404
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Item not found.</h1>
        <p className="text-sm text-zinc-400 max-w-md">
          We couldn&apos;t resolve this item id. It may have been removed, the link is
          malformed, or the source is unreachable. Random sources (Wikipedia / WikiVoyage)
          rotate — yesterday&apos;s deep link may no longer exist.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-700/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300 hover:border-emerald-500 hover:text-emerald-200 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to scroller
      </Link>
    </div>
  );
}
