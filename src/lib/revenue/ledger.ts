// Manual, evidence-only ledger for providers without a reporting API
// (Amazon Associates). Entries live in data/revenue/ledger.json.
import { promises as fs } from "node:fs";
import path from "node:path";
import type { RevenueSiteId } from "./sites";

export type LedgerEntry = {
  date: string; // YYYY-MM-DD, provider's reporting day
  site: RevenueSiteId;
  source: "amazon" | "adsense" | "other";
  amount: number;
  currency: string;
  evidence?: string;
};

export async function readLedger(): Promise<{ entries: LedgerEntry[]; error?: string }> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", "revenue", "ledger.json"), "utf8");
    const parsed = JSON.parse(raw) as { entries?: LedgerEntry[] };
    const entries = (parsed.entries ?? []).filter(
      (entry) =>
        typeof entry.date === "string" &&
        typeof entry.site === "string" &&
        typeof entry.amount === "number" &&
        Number.isFinite(entry.amount),
    );
    return { entries };
  } catch (error) {
    return { entries: [], error: error instanceof Error ? error.message : String(error) };
  }
}
