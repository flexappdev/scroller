// The Scroller app icon: the header logo (pink tile, white ScrollText glyph,
// glossy top-left) as one SVG, shared by the favicon, Apple touch icon and
// the PWA manifest icons so the home-screen icon matches the app.

const GLYPH = [
  "M15 12h-5",
  "M15 8h-5",
  "M19 17V5a2 2 0 0 0-2-2H4",
  "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3",
];

/**
 * @param maskable Full-bleed square with the glyph inside Android's 80% safe
 *   zone, for launchers that crop icons to their own shape.
 */
export function appIconSvg({ maskable = false }: { maskable?: boolean } = {}): string {
  const radius = maskable ? 0 : 14;
  // Glyph is drawn on a 24-unit grid; scale and centre it in the 64-unit tile.
  const scale = maskable ? 1.4 : 1.5;
  const offset = (64 - 24 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="gloss" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.5"/>
      <stop offset="0.48" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="${radius}" fill="#ec4899"/>
  <rect width="64" height="64" rx="${radius}" fill="url(#gloss)"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    ${GLYPH.map((d) => `<path d="${d}"/>`).join("\n    ")}
  </g>
</svg>`;
}

export function appIconDataUri(options?: { maskable?: boolean }): string {
  return `data:image/svg+xml;base64,${Buffer.from(appIconSvg(options)).toString("base64")}`;
}
