export type WikiSeedKind = "random" | "category" | "featured" | "pageid" | "title";

export interface WikiSeed {
  id: string;
  label: string;
  kind: WikiSeedKind;
  value: string | null;
  lang: string;
  max_pages: number;
  priority: number;
  enabled: boolean;
  last_run_at: string | null;
  last_run_count: number | null;
  last_run_status: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WikiIndexRow {
  pageid: number;
  title: string;
  slug: string;
  lang: string;
  category: string;
  description: string | null;
  extract: string | null;
  lead_image_url: string | null;
  source_url: string;
  read_mins: number;
  word_count: number;
  media_count: number;
  section_count: number;
  mongo_ref: string | null;
  sync_status: "ok" | "partial" | "error";
  data: Record<string, unknown>;
  fetched_at: string;
  updated_at: string;
}

export interface WikiSection {
  toclevel: number;
  level: string;
  line: string;
  anchor: string;
  index: string;
  html?: string;
}

export interface WikiMedia {
  title: string;
  type: "image" | "video" | "audio" | "other";
  caption?: string;
  srcset?: Array<{ src: string; scale?: string }>;
  original?: string;
  thumbnail?: string;
}

export interface WikiFullDoc {
  pageid: number;
  title: string;
  slug: string;
  lang: string;
  category: string;
  description: string | null;
  extract: string | null;
  source_url: string;
  lead_image_url: string | null;
  html: string | null;
  sections: WikiSection[];
  media: WikiMedia[];
  infobox: Record<string, string> | null;
  read_mins: number;
  word_count: number;
  fetched_at: string;
}

export interface WikiRunReport {
  run_id: string;
  started_at: string;
  finished_at: string;
  seeds: number;
  fetched: number;
  upserted: number;
  failed: number;
  status: "ok" | "partial" | "error";
}
