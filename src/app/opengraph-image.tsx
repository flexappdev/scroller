import { ImageResponse } from "next/og";

export const alt = "Scroller — mobile-first vertical feed across videos, repos, prompts, apps, sites, wiki and images";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          fontFamily: "system-ui",
          color: "#f4f4f5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              background: "#0a0a0a",
              border: "3px solid #10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              color: "#10b981",
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.5 }}>Scroller</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1 }}>
            One feed. Every source.
          </div>
          <div style={{ fontSize: 24, color: "#a1a1aa", maxWidth: 900 }}>
            Videos · GitHub · Prompts · Apps · Sites · Wikipedia · WikiVoyage · Amazon · Images
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 18, color: "#71717a", fontFamily: "monospace" }}>
          <div>scroller-psi.vercel.app</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "block", width: 10, height: 10, borderRadius: 5, background: "#10b981" }} />
            v0.3.0
          </div>
        </div>
      </div>
    ),
    size,
  );
}
