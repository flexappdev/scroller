import Link from "next/link";
import { notFound } from "next/navigation";
import { getSite } from "@/lib/cms/sites";
import { SiteEditor } from "./SiteEditor";

export const dynamic = "force-dynamic";

export default async function AdminSiteEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw);
  const site = await getSite(id);
  if (!site) notFound();

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto space-y-6">
      <nav className="text-xs text-zinc-500 font-mono">
        <Link href="/admin/sites" className="hover:text-emerald-400">../sites</Link>
        <span> / </span>
        <span className="text-zinc-300">{site.id}</span>
      </nav>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{site.title}</h1>
      <SiteEditor site={site} />
    </div>
  );
}
