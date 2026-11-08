import type { Metadata } from "next";
import PlayClient from "./PlayClient";
import { buildPlayDeck } from "@/lib/play";

export const metadata: Metadata = {
  title: "Play: smart and funny, one swipe at a time",
  description:
    "A full-screen feed of knowledge bits and funny bits with streaks, duels, gold drops and a spin button. Scroll smart.",
  alternates: { canonical: "/play" },
};

type PageProps = { searchParams: Promise<{ duel?: string }> };

export default async function PlayPage({ searchParams }: PageProps) {
  const [{ duel }, deck] = await Promise.all([searchParams, buildPlayDeck({ maxPerPack: 30 })]);
  return <PlayClient deck={deck} duelParam={duel} />;
}
