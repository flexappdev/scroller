import type { Metadata } from "next";
import { headers } from "next/headers";
import ChannelTV from "@/components/ChannelTV";
import { buildRuntimeItems, resolveChannelProfile } from "@/lib/ms-scroll-runtime";
import { listScrollerPacks } from "@/lib/scroller";

async function getChannel() {
  const requestHeaders = await headers();
  return resolveChannelProfile(requestHeaders.get("host"));
}

export async function generateMetadata(): Promise<Metadata> {
  const channel = await getChannel();
  return {
    title: `${channel.name} TV`,
    description: `${channel.tagline} Always-on programming with 60 scheduled 24-minute POMs per broadcast day.`,
  };
}

export default async function TVPage() {
  const [channel, packs] = await Promise.all([getChannel(), listScrollerPacks()]);
  const items = buildRuntimeItems(packs, channel);
  return <ChannelTV items={items} channel={channel} />;
}
