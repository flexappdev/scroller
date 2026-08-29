"use client";
import { Suspense, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import StickyHeader from "./StickyHeader";
import StickyFooter from "./StickyFooter";

// Width of the desktop preview side-panel — must match the value used
// in ItemModal's side-panel render (`w-[28rem]`).
const PREVIEW_PANEL_WIDTH = 448;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersiveHome = pathname === "/";
  const [previewOpen, setPreviewOpen] = useState(false);
  const rightMargin = immersiveHome ? 0 : previewOpen ? PREVIEW_PANEL_WIDTH : 0;

  // v3.2 — no sidebar. All nav lives inside StickyHeader's Assets dropdown.
  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", `0px`);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setPreviewOpen(root.getAttribute("data-preview-open") === "1");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-preview-open"] });
    return () => observer.disconnect();
  }, []);

  if (immersiveHome) {
    return (
      <>
        <Suspense fallback={null}>
          <StickyHeader />
        </Suspense>
        <main className="min-h-[100dvh] bg-black">{children}</main>
        <StickyFooter />
      </>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <StickyHeader />
      </Suspense>
      <main
        className="min-h-screen pt-14 pb-20 transition-[margin] duration-200"
        style={{ marginRight: `${rightMargin}px` }}
      >
        {children}
      </main>
      <StickyFooter />
    </>
  );
}
