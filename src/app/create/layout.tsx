import type { Metadata } from "next";

// Personal or private screen: keep it out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
