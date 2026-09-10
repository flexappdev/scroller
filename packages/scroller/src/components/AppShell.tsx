"use client";

/**
 * AppShell — thin wrapper over `Chrome` that adds slot-based header/footer
 * and automatic immersive-mode detection on the site root ("/").
 *
 * The header + footer stay as slots (opaque ReactNodes) — per-site headers
 * (nav, wordmark, search) are still authored in each app until StickyHeader
 * can be broken into a config-driven primitive. See BACKLOG v4.0.
 */

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Chrome } from "./Chrome";

export interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  /**
   * Explicit immersive override. When omitted, defaults to `true` on "/"
   * (home) and `false` everywhere else — matches v3.5 behavior.
   */
  immersive?: boolean;
}

export function AppShell({ children, header, footer, immersive }: AppShellProps) {
  const pathname = usePathname();
  const isImmersive = immersive ?? pathname === "/";
  return (
    <Chrome header={header} footer={footer} immersive={isImmersive}>
      {children}
    </Chrome>
  );
}
