/**
 * Diagram tokens — abc-diagrams style guide, remapped to scroller's
 * emerald accent. Values reference CSS variables from globals.css so
 * light/dark theme switches ripple into every panel without touching
 * each component. Hex fallbacks keep the panels sane when rendered
 * outside the app (Storybook, static export, etc.).
 */

export const DIAGRAM_TOKENS = {
  paper: "var(--surface, #fafafa)",
  paper2: "var(--surface-elevated, #ffffff)",
  ink: "var(--ink, #111827)",
  ink90: "var(--ink, #1f2937)",
  muted: "var(--ink-muted, #6b7280)",
  hairline: "var(--hairline, #e5e7eb)",
  hairlineStrong: "var(--hairline-strong, #d1d5db)",
  accent: "#10b981",
  accentSoft: "rgba(16, 185, 129, 0.10)",
  accentInk: "#ffffff",
} as const;

export const DIAGRAM_FONT = "'Inter', system-ui, -apple-system, sans-serif";
export const DIAGRAM_MONO = "'JetBrains Mono', ui-monospace, monospace";

export const labelStyle: React.SVGAttributes<SVGTextElement> = {
  fontFamily: DIAGRAM_FONT,
  fontSize: 13,
  fill: DIAGRAM_TOKENS.ink,
};

export const captionStyle: React.SVGAttributes<SVGTextElement> = {
  fontFamily: DIAGRAM_FONT,
  fontSize: 11,
  fill: DIAGRAM_TOKENS.muted,
};

export const monoStyle: React.SVGAttributes<SVGTextElement> = {
  fontFamily: DIAGRAM_MONO,
  fontSize: 10,
  fill: DIAGRAM_TOKENS.muted,
};
