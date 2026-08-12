import { DIAGRAM_TOKENS as T, monoStyle, captionStyle } from "./tokens";
import { Node, Edge } from "./_primitives";

/**
 * Cache flow — three-layer fallback. Request enters Next.js, tries
 * unstable_cache first (hot), falls through to Mongo (warm), then S3
 * signed URLs (cold). Dashed edges mark fallbacks.
 */
export function CacheFlow() {
  return (
    <svg
      viewBox="0 0 780 300"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby="cache-title"
    >
      <title id="cache-title">Scroller cache + fallback chain</title>

      <Node x={20} y={120} w={130} h={60} label="Request" sub="RSC + client" />

      <Node x={210} y={40} w={150} h={60} label="unstable_cache" sub="ISR 300s (hot)" accent />
      <Node x={210} y={120} w={150} h={60} label="Mongo AIDB" sub="warm cache" />
      <Node x={210} y={200} w={150} h={60} label="S3 com27" sub="signed URL · cold" />

      <Node x={430} y={40} w={150} h={60} label="Fetcher" sub="live API" />
      <Node x={430} y={120} w={150} h={60} label="Fetcher" sub="upstream fallback" />
      <Node x={430} y={200} w={150} h={60} label="Fetcher" sub="asset serve" />

      <Node x={630} y={120} w={130} h={60} label="Response" sub="normalised card" />

      {/* Primary path (solid, accent) */}
      <Edge from={[150, 150]} to={[210, 70]} />
      <Edge from={[360, 70]} to={[430, 70]} label="hit" />
      <Edge from={[580, 70]} to={[630, 140]} />

      {/* Fallback to Mongo (dashed) */}
      <Edge from={[150, 150]} to={[210, 150]} dashed />
      <Edge from={[360, 150]} to={[430, 150]} label="miss → mongo" />
      <Edge from={[580, 150]} to={[630, 150]} />

      {/* Fallback to S3 (dashed) */}
      <Edge from={[150, 150]} to={[210, 230]} dashed />
      <Edge from={[360, 230]} to={[430, 230]} label="miss → s3" />
      <Edge from={[580, 230]} to={[630, 160]} dashed />

      <text x={390} y={286} textAnchor="middle" {...captionStyle}>
        Solid = hot path · dashed = fallback · warm cache absorbs Wikipedia bursts
      </text>
    </svg>
  );
}
