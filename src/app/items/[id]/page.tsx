import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getApps, getPrompts, getStars, getVideos } from "@/lib/fetchers";
import { listSites, getSite } from "@/lib/cms/sites";
import { getAmazonItems } from "@/lib/scroll/amazon";
import { getImageByKey } from "@/lib/scroll/images";

export const dynamic = "force-dynamic";

type Detail = {
  title: string;
  subtitle: string;
  description?: string | null;
  image?: string | null;
  url?: string;
  urlLabel?: string;
  accent?: string;
  extra?: { label: string; value: string }[];
};

async function resolveDetail(id: string): Promise<Detail | null> {
  const decoded = decodeURIComponent(id);
  const colon = decoded.indexOf(":");
  if (colon < 0) return null;
  const kind = decoded.slice(0, colon);
  const inner = decoded.slice(colon + 1);

  if (kind === "image") {
    const key = decodeURIComponent(inner);
    const img = await getImageByKey(key);
    if (!img) return null;
    const sizeKb = (img.size / 1024).toFixed(1);
    const sizeMb = (img.size / 1024 / 1024).toFixed(2);
    const lastMod = img.lastModified ? new Date(img.lastModified) : null;
    return {
      title: img.title,
      subtitle: `Image · ${img.filename}`,
      image: img.url,
      url: img.url,
      urlLabel: "Open full size",
      accent: "#22d3ee",
      extra: [
        { label: "Filename", value: img.filename },
        { label: "Extension", value: img.ext || "—" },
        { label: "Content-Type", value: img.contentType || "—" },
        { label: "Size", value: img.size >= 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB` },
        { label: "Bytes", value: img.size.toLocaleString() },
        { label: "Prefix", value: img.prefix || "(root)" },
        { label: "S3 Key", value: img.key },
        { label: "Bucket", value: img.bucket },
        { label: "Region", value: img.region },
        img.storageClass ? { label: "Storage class", value: img.storageClass } : null,
        img.etag ? { label: "ETag", value: img.etag } : null,
        lastMod ? { label: "Last modified", value: `${lastMod.toLocaleString()} (${lastMod.toISOString()})` } : null,
        { label: "Public URL", value: img.publicUrl },
      ].filter(Boolean) as { label: string; value: string }[],
    };
  }

  if (kind === "amazon") {
    const { items } = await getAmazonItems();
    const m = items.find((i) => i.id === inner);
    if (!m) return null;
    return {
      title: m.title,
      subtitle: `Amazon · ${m.category}`,
      description: m.description,
      image: m.image,
      url: m.url,
      urlLabel: "Buy on Amazon",
      accent: "#ff9900",
      extra: [
        m.price ? { label: "Price", value: m.price } : null,
        m.rating ? { label: "Rating", value: m.rating } : null,
        m.asin ? { label: "ASIN", value: m.asin } : null,
      ].filter(Boolean) as { label: string; value: string }[],
    };
  }

  if (kind === "site") {
    const s = await getSite(inner);
    if (!s) return null;
    return {
      title: s.title,
      subtitle: `Site · ${s.category}`,
      description: s.description,
      url: s.url,
      urlLabel: "Visit site",
      accent: s.accent ?? "#10b981",
    };
  }

  if (kind === "wiki" || kind === "wikivoyage") {
    const host = kind === "wikivoyage" ? "en.wikivoyage.org" : "en.wikipedia.org";
    // Fetch by pageid if numeric, otherwise by title
    const isNumericId = /^\d+$/.test(inner);
    const endpoint = isNumericId
      ? `https://${host}/api/rest_v1/page/summary/${inner}` // Wikipedia accepts title here too; pageid fallback below
      : `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(inner)}`;
    try {
      const res = await fetch(endpoint, { next: { revalidate: 0 }, headers: { "User-Agent": "scroller" } });
      if (!res.ok) return null;
      const j = (await res.json()) as { title: string; extract: string; thumbnail?: { source: string }; content_urls?: { desktop?: { page: string } } };
      return {
        title: j.title,
        subtitle: kind === "wikivoyage" ? "WikiVoyage" : "Wikipedia",
        description: j.extract,
        image: j.thumbnail?.source ?? null,
        url: j.content_urls?.desktop?.page ?? `https://${host}/wiki/${encodeURIComponent(j.title)}`,
        urlLabel: `Read on ${kind === "wikivoyage" ? "WikiVoyage" : "Wikipedia"}`,
        accent: kind === "wikivoyage" ? "#3b82f6" : "#e5e7eb",
      };
    } catch {
      return null;
    }
  }

  if (kind === "video") {
    const { videos } = await getVideos();
    const v = videos.find((x) => x.id === inner);
    if (!v) return null;
    return {
      title: v.title,
      subtitle: "Video · YouTube",
      image: v.thumbnail,
      url: v.url,
      urlLabel: "Watch on YouTube",
      accent: "#ef4444",
      extra: [{ label: "Published", value: new Date(v.published).toLocaleDateString() }],
    };
  }

  if (kind === "star") {
    const fullName = decodeURIComponent(inner);
    const { stars } = await getStars();
    const s = stars.find((x) => x.full_name === fullName);
    if (!s) return null;
    return {
      title: s.full_name,
      subtitle: `GitHub · ${s.language ?? "Repo"}`,
      description: s.description,
      url: s.html_url,
      urlLabel: "Open on GitHub",
      accent: "#a78bfa",
      extra: [
        { label: "Stars", value: s.stargazers_count.toLocaleString() },
        s.language ? { label: "Language", value: s.language } : null,
        s.topics.length ? { label: "Topics", value: s.topics.slice(0, 8).join(", ") } : null,
      ].filter(Boolean) as { label: string; value: string }[],
    };
  }

  if (kind === "prompt") {
    const act = decodeURIComponent(inner);
    const { prompts } = await getPrompts();
    const p = prompts.find((x) => x.act === act);
    if (!p) return null;
    return {
      title: p.act,
      subtitle: "AI Prompt",
      description: p.prompt,
      accent: "#f59e0b",
    };
  }

  if (kind === "app") {
    const { apps } = await getApps();
    const a = apps.find((x) => x.id === inner);
    if (!a) return null;
    return {
      title: a.display_name,
      subtitle: `${a.domain_name} · ${a.subdomain}`,
      description: `App id: ${a.id}`,
      accent: a.accent,
      extra: [
        a.monorepo ? { label: "Monorepo", value: a.monorepo } : null,
        a.port_v2 ? { label: "Port (v2)", value: String(a.port_v2) } : null,
      ].filter(Boolean) as { label: string; value: string }[],
    };
  }

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await resolveDetail(id);
  if (!detail) return { title: "Item not found" };
  const description = (detail.description ?? `${detail.subtitle} — open in Scroller.`).slice(0, 160);
  return {
    title: detail.title,
    description,
    openGraph: {
      title: detail.title,
      description,
      type: "article" as const,
      ...(detail.image ? { images: [{ url: detail.image }] } : {}),
    },
    twitter: {
      card: detail.image ? ("summary_large_image" as const) : ("summary" as const),
      title: detail.title,
      description,
      ...(detail.image ? { images: [detail.image] } : {}),
    },
  };
}

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await resolveDetail(id);
  if (!detail) notFound();

  // referrer link approximation — back to source listing
  const decoded = decodeURIComponent(id);
  const kind = decoded.split(":")[0];
  const backHref =
    kind === "amazon" ? "/?source=amazon" :
    kind === "image" ? "/?source=images" :
    kind === "site" ? "/sites" :
    kind === "wiki" || kind === "wikivoyage" ? `/?source=${kind}` :
    kind === "video" ? "/videos" :
    kind === "star" ? "/github" :
    kind === "prompt" ? "/prompts" :
    kind === "app" ? "/apps" :
    "/";

  // Touch listSites so build doesn't tree-shake away the CMS dependency on this route
  void listSites;

  return (
    <article className="px-6 py-8 max-w-3xl mx-auto space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-emerald-400 transition-colors">
        <ArrowLeft className="h-3 w-3" />
        Back
      </Link>

      <header className="space-y-2" style={detail.accent ? { borderLeft: `3px solid ${detail.accent}`, paddingLeft: 12 } : undefined}>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">{detail.subtitle}</div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">{detail.title}</h1>
      </header>

      {detail.image && (
        <div className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={detail.image} alt={detail.title} className="w-full max-h-[60vh] object-contain" />
        </div>
      )}

      {detail.description && (
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{detail.description}</p>
      )}

      {detail.extra && detail.extra.length > 0 && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
          {detail.extra.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">{row.label}</dt>
              <dd className="text-sm text-zinc-300 font-mono text-right">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {detail.url && (
        <div>
          <a
            href={detail.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-emerald-700/40 bg-emerald-950/40 px-4 py-2.5 text-sm text-emerald-300 hover:border-emerald-500 hover:text-emerald-200 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            {detail.urlLabel ?? "Open external"}
          </a>
        </div>
      )}
    </article>
  );
}
