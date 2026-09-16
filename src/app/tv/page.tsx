import type { Metadata } from "next";
import { headers } from "next/headers";
import ChannelTV from "@/components/ChannelTV";
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
    title: `${channel.name} TV`,
    description: `${channel.tagline} Always-on programming with 60 scheduled 24-minute POMs per broadcast day.`,
  };
}

export default async function TVPage({ searchParams }: PageProps) {
  const { channel: override } = await searchParams;
  const [channel, packs] = await Promise.all([getChannel(override), listScrollerPacks()]);
  const items = buildRuntimeItems(packs, channel);
  return <ChannelTV items={items} channel={channel} />;
}
