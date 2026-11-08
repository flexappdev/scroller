import type { Metadata } from "next";
import TasteClient from "./TasteClient";
import { buildPlayDeck } from "@/lib/play";

export const metadata: Metadata = {
  title: "Taste",
  description: "Private taste check for the Play feed.",
  robots: { index: false, follow: false },
};

export default async function TastePage() {
  const deck = await buildPlayDeck();
  // Send a sample, not the whole library: 120 smart + 40 funny is plenty for 20 picks.
  const shuffle = <T,>(list: T[]) => list.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
  const pool = [...shuffle(deck.kbits).slice(0, 120), ...shuffle(deck.fbits).slice(0, 40)];
  return <TasteClient pool={pool} />;
}
