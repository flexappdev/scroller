import { DIAGRAM_TOKENS as T, labelStyle, monoStyle, captionStyle } from "./tokens";

/**
 * MobileFeedAnatomy — a labelled schematic of the ArticleCard used by
 * MobileWikiScroll. Full-viewport image cover + gradient + bottom-left
 * overlay + right-side action rail (42px pills).
 */
export function MobileFeedAnatomy() {
  return (
    <svg
      viewBox="0 0 780 380"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby="mobile-title"
    >
      <title id="mobile-title">Mobile ArticleCard anatomy</title>

      {/* Phone frame */}
      <rect x={290} y={30} width={200} height={340} rx={22} fill={T.paper2} stroke={T.hairlineStrong} />
      <rect x={302} y={42} width={176} height={316} rx={14} fill={T.paper} stroke={T.hairline} />

      {/* Image cover placeholder */}
      <rect x={302} y={42} width={176} height={316} rx={14} fill={T.accentSoft} />

      {/* Overlay gradient stub */}
      <rect x={302} y={230} width={176} height={128} rx={0} fill="rgba(0,0,0,0.35)" />

      {/* Top chip */}
      <rect x={310} y={54} width={100} height={20} rx={10} fill="rgba(0,0,0,0.5)" />
      <text x={318} y={68} {...monoStyle} fill="#ffffff">
        Scroller · Wiki
      </text>

      {/* Action rail (right) */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <circle cx={462} cy={190 + i * 44} r={12} fill={T.paper2} stroke={T.hairline} />
          <text x={462} y={194 + i * 44} textAnchor="middle" {...monoStyle} fill={T.ink}>
            {["♥", "◐", "☆", "→"][i]}
          </text>
        </g>
      ))}

      {/* Bottom overlay text */}
      <rect x={310} y={280} width={70} height={12} rx={4} fill={T.accent} />
      <text x={315} y={290} {...monoStyle} fill="#ffffff">
        Wikipedia
      </text>
      <rect x={310} y={300} width={140} height={10} rx={2} fill="rgba(255,255,255,0.85)" />
      <rect x={310} y={314} width={125} height={6} rx={2} fill="rgba(255,255,255,0.55)" />
      <rect x={310} y={324} width={115} height={6} rx={2} fill="rgba(255,255,255,0.55)" />

      {/* Callouts */}
      <text x={80} y={70} {...labelStyle} fontWeight={500}>Cover image</text>
      <text x={80} y={86} {...monoStyle}>eager on active card</text>
      <line x1={160} y1={80} x2={302} y2={110} stroke={T.hairlineStrong} strokeWidth={1} />

      <text x={80} y={150} {...labelStyle} fontWeight={500}>Source chip</text>
      <text x={80} y={166} {...monoStyle}>emerald accent · #10b981</text>
      <line x1={160} y1={160} x2={315} y2={68} stroke={T.hairlineStrong} strokeWidth={1} />

      <text x={80} y={230} {...labelStyle} fontWeight={500}>Overlay copy</text>
      <text x={80} y={246} {...monoStyle}>title · 4-line extract · meta</text>
      <line x1={160} y1={240} x2={302} y2={295} stroke={T.hairlineStrong} strokeWidth={1} />

      <text x={560} y={110} {...labelStyle} fontWeight={500}>Action rail</text>
      <text x={560} y={126} {...monoStyle}>42px pills · like/read/save/share</text>
      <line x1={555} y1={120} x2={478} y2={220} stroke={T.hairlineStrong} strokeWidth={1} />

      <text x={560} y={230} {...labelStyle} fontWeight={500}>Snap feed</text>
      <text x={560} y={246} {...monoStyle}>h-100dvh · scroll-snap-type: y</text>

      <text x={390} y={378} textAnchor="middle" {...captionStyle}>
        Cloned from wikai — points HUD in the TopBar (+1 seen · +2 like · +3 save).
      </text>
    </svg>
  );
}
