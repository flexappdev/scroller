import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://scroller-psi.vercel.app";
const DEFAULT_DESCRIPTION =
  "One feed for everything worth scrolling — videos, GitHub stars, AI prompts, apps, curated sites, Wikipedia, WikiVoyage, Amazon picks, and images.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: "Scroller", template: "%s · Scroller" },
  description: DEFAULT_DESCRIPTION,
  applicationName: "Scroller",
  keywords: ["scroller", "feed", "videos", "wikipedia", "wikivoyage", "amazon", "github stars", "ai prompts"],
  openGraph: {
    type: "website",
    siteName: "Scroller",
    title: "Scroller",
    description: DEFAULT_DESCRIPTION,
    url: BASE_URL,
    images: [{ url: "/og-hero.png", width: 1024, height: 576, alt: "Scroller — One feed. Every source." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scroller",
    description: DEFAULT_DESCRIPTION,
    images: ["/og-hero.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#0a0a0a] text-zinc-100`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
