"use client";
import { useState } from "react";
import AppNav from "./AppNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 52 : 180;

  return (
    <>
      <AppNav collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className="min-h-screen pb-12 transition-[margin] duration-200"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        {children}
      </main>
    </>
  );
}
