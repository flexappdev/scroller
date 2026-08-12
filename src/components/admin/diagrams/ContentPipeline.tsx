import { DIAGRAM_TOKENS as T, monoStyle, captionStyle } from "./tokens";
import { Node, Edge } from "./_primitives";

/**
 * Content pipeline — how bespoke assets get into com27. ABC skills and
 * bespoke scripts drive Runware FLUX (heroes + prompts), Seedance
 * (video loops) and thum.io (site screenshots). Everything lands in
 * s3://com27/scroller/*.
 */
export function ContentPipeline() {
  return (
    <svg
      viewBox="0 0 780 320"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby="pipeline-title"
    >
      <title id="pipeline-title">Content generation pipeline</title>

      {/* Left: producers */}
      <text x={40} y={22} {...monoStyle} fill={T.muted}>
        DRIVERS
      </text>
      <Node x={20} y={40} w={160} h={44} label="/abc-diagrams" sub="editorial SVG" />
      <Node x={20} y={94} w={160} h={44} label="/abc-videos" sub="script+TTS+loop" />
      <Node x={20} y={148} w={160} h={44} label="/iad" sub="hero + portrait" />
      <Node x={20} y={202} w={160} h={44} label="scripts/*.mjs" sub="bespoke Node" />

      {/* Middle: engines */}
      <text x={310} y={22} {...monoStyle} fill={T.muted}>
        ENGINES
      </text>
      <Node x={270} y={40} w={160} h={54} label="Runware FLUX" sub="text→image · $" />
      <Node x={270} y={110} w={160} h={54} label="Seedance" sub="5s MP4 loops" />
      <Node x={270} y={180} w={160} h={54} label="thum.io" sub="site screenshots" />

      {/* Right: bucket */}
      <text x={580} y={22} {...monoStyle} fill={T.muted}>
        STORAGE
      </text>
      <Node x={540} y={110} w={220} h={80} label="s3://com27/scroller/*" sub="15-field metadata" accent />

      {/* Left → engines */}
      <Edge from={[180, 62]} to={[270, 67]} />
      <Edge from={[180, 116]} to={[270, 137]} />
      <Edge from={[180, 170]} to={[270, 137]} />
      <Edge from={[180, 224]} to={[270, 207]} />

      {/* Engines → bucket */}
      <Edge from={[430, 67]} to={[540, 130]} label="prompts + heroes" />
      <Edge from={[430, 137]} to={[540, 150]} label="video-loops" />
      <Edge from={[430, 207]} to={[540, 170]} label="site-shots" />

      <text x={390} y={306} textAnchor="middle" {...captionStyle}>
        All assets are content-addressed with a PublicReadScroller policy on the com27 bucket.
      </text>
    </svg>
  );
}
