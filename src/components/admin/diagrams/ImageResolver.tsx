import { DIAGRAM_TOKENS as T, captionStyle, monoStyle } from "./tokens";
import { Node, Edge } from "./_primitives";

/**
 * imageFor(card) — decision tree for the hero image on each card kind.
 * Falls through to a hashed 5-gradient palette when no upstream image
 * is available.
 */
export function ImageResolver() {
  return (
    <svg
      viewBox="0 0 780 380"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby="image-title"
    >
      <title id="image-title">imageFor(card) resolution chain</title>

      <Node x={30} y={160} w={140} h={60} label="Card { kind }" sub="8 kinds" />

      {/* Branches */}
      <Node x={230} y={20} w={150} h={40} label="wiki" />
      <Node x={230} y={70} w={150} h={40} label="images" />
      <Node x={230} y={120} w={150} h={40} label="prompts" />
      <Node x={230} y={170} w={150} h={40} label="sites" />
      <Node x={230} y={220} w={150} h={40} label="apps" />
      <Node x={230} y={270} w={150} h={40} label="github" />
      <Node x={230} y={320} w={150} h={40} label="videos" />

      {/* Resolvers */}
      <Node x={440} y={20} w={180} h={40} label="thumbnail.source" sub="upload.wikimedia.org" />
      <Node x={440} y={70} w={180} h={40} label="signed s3 url" sub="com27/scroller/images" />
      <Node x={440} y={120} w={180} h={40} label="signed s3 url" sub="com27/scroller/prompts" />
      <Node x={440} y={170} w={180} h={40} label="thum.io" sub="1280 · 15s wait" />
      <Node x={440} y={220} w={180} h={40} label="thum.io" sub="site screenshot" />
      <Node x={440} y={270} w={180} h={40} label="og.githubassets" sub="repo card" />
      <Node x={440} y={320} w={180} h={40} label="i.ytimg.com" sub="yt maxres" />

      <Node x={670} y={160} w={100} h={60} label="Fallback" sub="hashed gradient" accent />

      {[20, 70, 120, 170, 220, 270, 320].map((y, i) => (
        <g key={i}>
          <Edge from={[170, 190]} to={[230, y + 20]} />
          <Edge from={[380, y + 20]} to={[440, y + 20]} />
          <Edge from={[620, y + 20]} to={[670, 190]} dashed />
        </g>
      ))}

      <text x={390} y={378} textAnchor="middle" {...captionStyle}>
        On any 404 the &lt;img&gt; hides so the deterministic hash-gradient background stays.
      </text>
    </svg>
  );
}
