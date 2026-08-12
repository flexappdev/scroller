import { DIAGRAM_TOKENS as T, captionStyle, monoStyle } from "./tokens";
import { Node, Edge } from "./_primitives";

/**
 * Auth gate — Supabase middleware guards /admin/*. Everyone else
 * passes through. The allowlist is a single email
 * (mat@matsiems.com) — no roles table needed.
 */
export function AuthGate() {
  return (
    <svg
      viewBox="0 0 780 300"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby="auth-title"
    >
      <title id="auth-title">Supabase auth gate</title>

      <Node x={20} y={120} w={140} h={60} label="Request" sub="any pathname" />
      <Node x={210} y={120} w={160} h={60} label="middleware.ts" sub="Supabase SSR" accent />

      {/* Decision fork */}
      <Node x={430} y={30} w={150} h={40} label="/admin/*" />
      <Node x={430} y={90} w={150} h={40} label="/api/admin/*" />
      <Node x={430} y={150} w={150} h={40} label="/login" />
      <Node x={430} y={210} w={150} h={40} label="everything else" />

      {/* Outcomes */}
      <Node x={630} y={30} w={130} h={40} label="Verify email" sub="mat@matsiems.com" />
      <Node x={630} y={90} w={130} h={40} label="401 if unauth" />
      <Node x={630} y={150} w={130} h={40} label="OAuth broker" sub="Supabase" />
      <Node x={630} y={210} w={130} h={40} label="200 pass" />

      <Edge from={[160, 150]} to={[210, 150]} />
      <Edge from={[370, 130]} to={[430, 50]} />
      <Edge from={[370, 140]} to={[430, 110]} />
      <Edge from={[370, 160]} to={[430, 170]} />
      <Edge from={[370, 170]} to={[430, 230]} />

      <Edge from={[580, 50]} to={[630, 50]} />
      <Edge from={[580, 110]} to={[630, 110]} />
      <Edge from={[580, 170]} to={[630, 170]} />
      <Edge from={[580, 230]} to={[630, 230]} />

      <text x={390} y={286} textAnchor="middle" {...captionStyle}>
        Missing Supabase env → middleware returns 503 (not 500) so public routes stay up during outages.
      </text>
    </svg>
  );
}
