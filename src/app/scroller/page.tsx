import type { Metadata } from "next";
import { headers } from "next/headers";
import ChannelScroller from "@/components/ChannelScroller";
import { buildRuntimeItems, resolveChannelProfile } from "@/lib/ms-scroll-runtime";
import { listScrollerPacks } from "@/lib/scroller";

type PageProps = {
  searchParams: Promise<{ channel?: string }>;
};

async function getChannel(override?: string) {
  const requestHeaders = await headers();
  return resolveChannelProfile(requestHeaders.get("host"), override);
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { channel: override } = await searchParams;
  const channel = await getChannel(override);
  return {
    title: `${channel.name} Scroller`,
    description: `${channel.tagline} Full-screen media-first scroll with a compact grid for the complete catalogue.`,
  };
}

export default async function ScrollerIndexPage({ searchParams }: PageProps) {
  const { channel: override } = await searchParams;
  const [channel, packs] = await Promise.all([getChannel(override), listScrollerPacks()]);
  const items = buildRuntimeItems(packs, channel);
  return <ChannelScroller items={items} channel={channel} />;
}
