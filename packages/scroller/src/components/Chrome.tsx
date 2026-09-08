"use client";

import { Suspense, useState, useEffect, type ReactNode } from "react";

const PREVIEW_PANEL_WIDTH = 448;

export interface ChromeProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  immersive?: boolean;
}

export function Chrome({ children, header, footer, immersive = false }: ChromeProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const rightMargin = immersive ? 0 : previewOpen ? PREVIEW_PANEL_WIDTH : 0;

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

  if (immersive) {
    return (
      <>
        {header && <Suspense fallback={null}>{header}</Suspense>}
        <main className="min-h-[100dvh] bg-black">{children}</main>
        {footer}
      </>
    );
  }

  return (
    <>
      {header && <Suspense fallback={null}>{header}</Suspense>}
      <main
        className="min-h-screen pt-14 pb-20 transition-[margin] duration-200"
        style={{ marginRight: `${rightMargin}px` }}
      >
        {children}
      </main>
      {footer}
    </>
  );
}
