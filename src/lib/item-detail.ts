import { getApps, getPrompts, getStars, getVideos } from "@/lib/fetchers";
import { getSite } from "@/lib/cms/sites";
import { getAmazonItems } from "@/lib/scroll/amazon";
import { getImageByKey } from "@/lib/scroll/images";

export type Detail = {
  title: string;
  subtitle: string;
  description?: string | null;
  image?: string | null;
  url?: string;
  urlLabel?: string;
  accent?: string;
  extra?: { label: string; value: string }[];
};

export async function resolveDetail(id: string): Promise<Detail | null> {
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
    const isNumericId = /^\d+$/.test(inner);
    try {
      if (isNumericId) {
        const params = new URLSearchParams({
          action: "query",
          format: "json",
          formatversion: "2",
          prop: "extracts|pageimages|info",
          pageids: inner,
          exintro: "1",
          explaintext: "1",
          inprop: "url",
          piprop: "thumbnail",
          pithumbsize: "1200",
          redirects: "1",
          origin: "*",
        });
        const res = await fetch(`https://${host}/w/api.php?${params}`, { next: { revalidate: 0 }, headers: { "User-Agent": "scroller" } });
        if (!res.ok) return null;
        const payload = (await res.json()) as { query?: { pages?: Array<{ missing?: boolean; title: string; extract?: string; thumbnail?: { source: string }; fullurl?: string }> } };
        const page = payload.query?.pages?.[0];
        if (!page || page.missing) return null;
        return {
          title: page.title,
          subtitle: kind === "wikivoyage" ? "WikiVoyage" : "Wikipedia",
          description: page.extract ?? "",
          image: page.thumbnail?.source ?? null,
          url: page.fullurl ?? `https://${host}/wiki/${encodeURIComponent(page.title)}`,
          urlLabel: `Read on ${kind === "wikivoyage" ? "WikiVoyage" : "Wikipedia"}`,
          accent: kind === "wikivoyage" ? "#3b82f6" : "#e5e7eb",
        };
      }

      const endpoint = `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(inner)}`;
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
