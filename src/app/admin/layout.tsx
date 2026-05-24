import type { ReactNode } from "react";
import { AdminNav } from "./AdminNav";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <AdminNav />
      {children}
    </div>
  );
}
