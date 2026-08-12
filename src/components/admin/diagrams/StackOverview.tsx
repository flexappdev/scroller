import { DIAGRAM_TOKENS as T, captionStyle, monoStyle, labelStyle } from "./tokens";

/**
 * StackOverview — the seven-layer scroller stack. Every layer is a
 * one-liner + its role. Meant to be the first panel a new engineer
 * reads.
 */
export function StackOverview() {
  const layers = [
    { title: "Vercel edge", role: "CDN · caching · CSP · analytics" },
    { title: "Next.js 15 (App Router)", role: "RSC · ISR 300s · server actions" },
    { title: "React 19", role: "client cards · MobileWikiScroll · SidePanel" },
    { title: "Tailwind 3.4 + tokens", role: "utility classes on top of CSS vars" },
    { title: "Supabase (SSR)", role: "auth · scroller_sites · scroller_wiki_index" },
    { title: "MongoDB AIDB (FLEET)", role: "wiki + wikivoyage warm cache" },
    { title: "S3 com27 (eu-west-2)", role: "heroes · prompts · loops · screenshots" },
  ];
  return (
    <svg
      viewBox="0 0 780 380"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby="stack-title"
    >
      <title id="stack-title">Scroller stack overview</title>

      {layers.map((l, i) => {
        const y = 20 + i * 46;
        return (
          <g key={l.title}>
            <rect
              x={40}
              y={y}
              width={700}
              height={38}
              rx={6}
              fill={i === 1 ? T.accentSoft : T.paper2}
              stroke={i === 1 ? T.accent : T.hairline}
            />
            <text x={56} y={y + 24} {...labelStyle} fontWeight={500}>
              {l.title}
            </text>
            <text x={340} y={y + 24} {...monoStyle}>
              {l.role}
            </text>
            <text x={720} y={y + 24} textAnchor="end" {...monoStyle} fill={T.muted}>
              L{layers.length - i}
            </text>
          </g>
        );
      })}

      <text x={390} y={366} textAnchor="middle" {...captionStyle}>
        Layers are cache-hierarchical from the browser down: hotter and cheaper at the top.
      </text>
    </svg>
  );
}
