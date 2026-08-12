import { DIAGRAM_TOKENS as T, labelStyle, monoStyle } from "./tokens";
import { Node, Edge } from "./_primitives";

/**
 * System architecture — the 9 scroll sources on the left, the Next.js
 * server at the centre, and the delivery surfaces (browser + edge) on
 * the right. Focal accent on Next.js (centre of gravity).
 */
export function SystemArchitecture() {
  return (
    <svg
      viewBox="0 0 780 420"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby="arch-title"
    >
      <title id="arch-title">Scroller system architecture</title>

      {/* Sources (left column) */}
      <text x={40} y={22} {...monoStyle} fill={T.muted}>
        SOURCES
      </text>
      <Node x={20} y={30} w={140} h={34} label="Wikipedia" sub="live API" />
      <Node x={20} y={70} w={140} h={34} label="WikiVoyage" sub="Mongo · 67k" />
      <Node x={20} y={110} w={140} h={34} label="Amazon" sub="Zgbs · Mongo" />
      <Node x={20} y={150} w={140} h={34} label="Images" sub="S3 com27" />
      <Node x={20} y={190} w={140} h={34} label="Prompts" sub="S3 · 100 FLUX" />
      <Node x={20} y={230} w={140} h={34} label="Videos" sub="YouTube + S3" />
      <Node x={20} y={270} w={140} h={34} label="Sites" sub="Supabase" />
      <Node x={20} y={310} w={140} h={34} label="Apps" sub="fleet registry" />
      <Node x={20} y={350} w={140} h={34} label="GitHub" sub="stars API" />

      {/* Centre */}
      <text x={340} y={22} {...monoStyle} fill={T.muted}>
        SERVER
      </text>
      <Node x={280} y={140} w={180} h={90} label="Next.js 15" sub="App Router · RSC" accent />
      <text x={370} y={252} textAnchor="middle" {...monoStyle} fill={T.muted}>
        unstable_cache · ISR 300s
      </text>

      {/* Surfaces (right column) */}
      <text x={620} y={22} {...monoStyle} fill={T.muted}>
        SURFACES
      </text>
      <Node x={600} y={100} w={160} h={50} label="Desktop grid" sub="side-panel preview" />
      <Node x={600} y={175} w={160} h={50} label="Mobile snap feed" sub="wikai-style cards" />
      <Node x={600} y={250} w={160} h={50} label="/admin" sub="Supabase gated" />
      <Node x={600} y={325} w={160} h={50} label="Vercel edge" sub="CDN · CSP" />

      {/* Edges L→C */}
      <Edge from={[160, 47]} to={[280, 160]} />
      <Edge from={[160, 87]} to={[280, 170]} />
      <Edge from={[160, 127]} to={[280, 180]} />
      <Edge from={[160, 167]} to={[280, 185]} />
      <Edge from={[160, 207]} to={[280, 190]} />
      <Edge from={[160, 247]} to={[280, 195]} />
      <Edge from={[160, 287]} to={[280, 205]} />
      <Edge from={[160, 327]} to={[280, 215]} />
      <Edge from={[160, 367]} to={[280, 225]} />

      {/* Edges C→R */}
      <Edge from={[460, 160]} to={[600, 125]} label="RSC" />
      <Edge from={[460, 180]} to={[600, 200]} label="RSC" />
      <Edge from={[460, 200]} to={[600, 275]} label="middleware" />
      <Edge from={[460, 220]} to={[600, 350]} label="cache" />
    </svg>
  );
}
