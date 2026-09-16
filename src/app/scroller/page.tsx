import type { Metadata } from "next";
import { headers } from "next/headers";
import ChannelScroller from "@/components/ChannelScroller";
import { buildRuntimeItems, resolveChannelProfile } from "@/lib/ms-scroll-runtime";
import { listScrollerPacks } from "@/lib/scroller";

async function getChannel() {
  const requestHeaders = await headers();
  return resolveChannelProfile(requestHeaders.get("host"));
}

export async function generateMetadata(): Promise<Metadata> {
  const channel = await getChannel();
  return {
    title: `${channel.name} Scroller`,
    description: `${channel.tagline} Full-screen media-first scroll with a compact grid for the complete catalogue.`,
  };
}

export default async function ScrollerIndexPage() {
  const [channel, packs] = await Promise.all([getChannel(), listScrollerPacks()]);
  const items = buildRuntimeItems(packs, channel);
  return <ChannelScroller items={items} channel={channel} />;
}
