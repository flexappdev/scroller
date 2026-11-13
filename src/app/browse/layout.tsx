import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse every topic",
  description: "Browse Scroller by topic: Wikipedia, WikiVoyage, videos, apps, AI prompts and Top 100 lists, grouped so you can jump straight in.",
  alternates: { canonical: "/browse" },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
