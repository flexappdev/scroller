import { ImageResponse } from "next/og";
import { getScrollerPack, listScrollerPacks } from "@/lib/scroller";

// Per-pack share card (1200x630) so every Scroller pack gets its own preview
// on social, chat apps and Discover instead of the generic site image.

export const alt = "Scroller pack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const packs = await listScrollerPacks();
  return packs.map(({ manifest }) => ({ slug: manifest.slug }));
}

export default async function PackOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pack = await getScrollerPack(slug);
  const name = pack?.manifest.name ?? "Scroller";
  const tagline = pack?.manifest.tagline ?? "One feed. Every source.";
  const count = pack?.items.length ?? 0;
  const preview = (pack?.items ?? []).slice(0, 3).map((i) => i.title);
  const titleSize = name.length > 40 ? 60 : 76;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #0a0a0a 0%, #18181b 60%, #3b0a24 100%)",
          color: "#fafafa",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#ec4899",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 800,
              color: "#0a0a0a",
            }}
          >
            S
          </div>
          <div style={{ fontSize: 30, fontWeight: 600 }}>scroller.tv</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: titleSize, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5, maxWidth: 1070 }}>{name}</div>
          <div style={{ fontSize: 30, color: "#d4d4d8", maxWidth: 1000 }}>{tagline}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 22, color: "#a1a1aa" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {preview.map((t, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.18)",
                  maxWidth: 300,
                  overflow: "hidden",
                }}
              >
                {t.length > 24 ? `${t.slice(0, 23)}…` : t}
              </div>
            ))}
          </div>
          {count > 0 ? <div style={{ display: "flex", color: "#ec4899", fontWeight: 700 }}>{count} cards</div> : null}
        </div>
      </div>
    ),
    size,
  );
}
