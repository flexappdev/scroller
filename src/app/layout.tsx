import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scroller · Mstravel",
  description: "Mobile-first vertical feed across videos, repos, prompts, apps, and travel destinations.",
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
