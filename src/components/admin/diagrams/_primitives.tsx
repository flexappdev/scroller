import { DIAGRAM_TOKENS as T, labelStyle, monoStyle, captionStyle } from "./tokens";

export function Node({
  x,
  y,
  w,
  h,
  label,
  sub,
  accent = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill={accent ? T.accent : T.paper2}
        stroke={accent ? T.accent : T.hairline}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 - (sub ? 4 : -4)}
        textAnchor="middle"
        {...labelStyle}
        fill={accent ? T.accentInk : T.ink}
        fontWeight={500}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 14}
          textAnchor="middle"
          {...monoStyle}
          fill={accent ? "rgba(255,255,255,0.75)" : T.muted}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

export function Edge({
  from,
  to,
  label,
  dashed = false,
}: {
  from: [number, number];
  to: [number, number];
  label?: string;
  dashed?: boolean;
}) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={T.hairlineStrong}
        strokeWidth={1}
        strokeDasharray={dashed ? "4 3" : undefined}
      />
      {label && (
        <text x={midX} y={midY - 4} textAnchor="middle" {...captionStyle}>
          {label}
        </text>
      )}
    </g>
  );
}

export function Pill({
  x,
  y,
  w,
  h,
  label,
  tone = "default",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  tone?: "default" | "accent" | "soft";
}) {
  const fill = tone === "accent" ? T.accent : tone === "soft" ? T.accentSoft : T.paper2;
  const stroke = tone === "accent" ? T.accent : T.hairline;
  const ink = tone === "accent" ? T.accentInk : T.ink;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} />
      <text
        x={x + w / 2}
        y={y + h / 2 + 4}
        textAnchor="middle"
        {...labelStyle}
        fill={ink}
        fontWeight={500}
      >
        {label}
      </text>
    </g>
  );
}
