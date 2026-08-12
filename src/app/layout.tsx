import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
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

// FOUC-safe theme init — runs before hydration so the correct theme
// is on <html> at first paint. Default when unset: light.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('scroller-theme');if(t!=='light'&&t!=='dark'){t='light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <AppShell>{children}</AppShell>
        <Analytics />
      </body>
    </html>
  );
}
