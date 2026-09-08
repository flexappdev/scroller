"use client";
import { usePathname } from "next/navigation";
import { Chrome } from "@fleet/scroller";
import StickyHeader from "./StickyHeader";
import StickyFooter from "./StickyFooter";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersiveHome = pathname === "/";
  return (
    <Chrome
      header={<StickyHeader />}
      footer={<StickyFooter />}
      immersive={immersiveHome}
    >
      {children}
    </Chrome>
  );
}
