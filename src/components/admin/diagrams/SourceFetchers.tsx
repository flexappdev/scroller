import { DIAGRAM_TOKENS as T, monoStyle, captionStyle, labelStyle } from "./tokens";
import { Node, Edge } from "./_primitives";

/**
 * Source fetcher orchestration — the home feed fans out to 9 source
 * fetchers in parallel, each with its own per-source `.catch()` so
 * a single failure never crashes the merged feed.
 */
export function SourceFetchers() {
  const sources = [
    "wiki",
    "wikivoyage",
    "amazon",
    "images",
    "prompts",
    "videos",
    "sites",
    "apps",
    "github",
  ];
  return (
    <svg
      viewBox="0 0 780 380"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby="fetch-title"
    >
      <title id="fetch-title">Parallel source fetchers</title>

      <Node x={40} y={160} w={140} h={60} label="HomeClient" sub="mixed feed" />
      <Node x={620} y={160} w={140} h={60} label="Merge + shuffle" sub="dedupe · normalise" accent />

      {sources.map((s, i) => {
        const y = 20 + i * 38;
        return (
          <g key={s}>
            <Node x={310} y={y} w={160} h={30} label={`fetch:${s}`} />
            <Edge from={[180, 190]} to={[310, y + 15]} />
            <Edge from={[470, y + 15]} to={[620, 190]} dashed={i % 3 === 2} />
          </g>
        );
      })}

      <text x={390} y={366} textAnchor="middle" {...captionStyle}>
        Every fetcher wraps its call in `.catch(() =&gt; [])` — a dead upstream shrinks the feed, never crashes it.
      </text>
    </svg>
  );
}
