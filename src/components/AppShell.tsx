"use client";
import { AppShell as FleetAppShell } from "@fleet/scroller";
import StickyHeader from "./StickyHeader";
import StickyFooter from "./StickyFooter";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <FleetAppShell header={<StickyHeader />} footer={<StickyFooter />}>
      {children}
    </FleetAppShell>
  );
}
