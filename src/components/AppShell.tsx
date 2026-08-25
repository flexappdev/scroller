"use client";
import { Suspense, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AppNav from "./AppNav";
import StickyHeader from "./StickyHeader";
import StickyFooter from "./StickyFooter";

// Width of the desktop preview side-panel — must match the value used
// in ItemModal's side-panel render (`w-[28rem]`).
const PREVIEW_PANEL_WIDTH = 448;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersiveHome = pathname === "/";
  const [collapsed] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const sidebarWidth = immersiveHome ? 0 : collapsed ? 60 : 200;
  const rightMargin = immersiveHome ? 0 : previewOpen ? PREVIEW_PANEL_WIDTH : 0;

  // The root route is now the actual swipe feed, not a page inside the app
  // shell. Setting the variable to zero also prevents a first-paint sidebar
  // offset while the MediaAI route is hydrating.
  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", `${sidebarWidth}px`);
  }, [sidebarWidth]);

  // Watch the `data-preview-open` flag on <html> (set by ItemModal in
  // side-panel mode) and reflow main accordingly. MutationObserver keeps
  // this in sync without prop drilling through every page client.
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setPreviewOpen(root.getAttribute("data-preview-open") === "1");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-preview-open"] });
    return () => observer.disconnect();
  }, []);

  if (immersiveHome) {
    return <main className="min-h-[100dvh] bg-black">{children}</main>;
  }

  return (
    <>
      <AppNav collapsed={collapsed} />
      <Suspense fallback={null}>
        <StickyHeader />
      </Suspense>
      <main
        className="min-h-screen pt-12 pb-12 transition-[margin] duration-200"
        style={{ marginLeft: `${sidebarWidth}px`, marginRight: `${rightMargin}px` }}
      >
        {children}
      </main>
      <StickyFooter />
    </>
  );
}
