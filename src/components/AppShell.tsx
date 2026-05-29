"use client";
import { Suspense, useState, useEffect } from "react";
import AppNav from "./AppNav";
import StickyHeader from "./StickyHeader";
import StickyFooter from "./StickyFooter";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 52 : 180;

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", `${sidebarWidth}px`);
  }, [sidebarWidth]);

  return (
    <>
      <AppNav collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Suspense fallback={null}>
        <StickyHeader />
      </Suspense>
      <main
        className="min-h-screen pt-12 pb-12 transition-[margin] duration-200"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        {children}
      </main>
      <StickyFooter />
    </>
  );
}
