-- Scroller WIKI schema (v1)
-- scroller_wiki_index = light master index (queryable, paginated)
-- scroller_wiki_seeds = switchable category/random/featured seeds for the daily converter
-- scroller_wiki_log   = per-run audit
-- Heavy payload (html, sections, media list) lives in AIDB.WIKI_articles in Mongo,
-- keyed by pageid. Supabase is source of truth for the index.

create extension if not exists pgcrypto;

-- pg_trgm enables fuzzy/trigram indexes on title. Best-effort: some Supabase
-- plans lack it. Must be created BEFORE any gin_trgm_ops index references it.
do $$
begin
  create extension if not exists pg_trgm;
exception when others then null;
end$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- scroller_wiki_index — one row per cached article
create table if not exists public.scroller_wiki_index (
  pageid bigint primary key,
  title text not null,
  slug text not null,
  lang text not null default 'en',
  category text not null default 'random',         -- maps to seed.id (e.g. 'random', 'cat:Physics')
  description text,                                -- short eyebrow (one-liner)
  extract text,                                    -- plain-text summary
  lead_image_url text,
  source_url text not null,                        -- canonical wikipedia URL
  read_mins integer not null default 1,
  word_count integer not null default 0,
  media_count integer not null default 0,
  section_count integer not null default 0,
  mongo_ref text,                                  -- AIDB.WIKI_articles _id (string of pageid)
  sync_status text not null default 'ok',          -- 'ok' | 'partial' | 'error'
  data jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scroller_wiki_index_cat_idx on public.scroller_wiki_index(category, fetched_at desc);
create index if not exists scroller_wiki_index_updated_idx on public.scroller_wiki_index(updated_at desc);
create index if not exists scroller_wiki_index_slug_idx on public.scroller_wiki_index(slug);

-- Trigram index only if pg_trgm is available — otherwise fall back to ilike.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_trgm') then
    execute 'create index if not exists scroller_wiki_index_title_trgm
             on public.scroller_wiki_index using gin (title gin_trgm_ops)';
  end if;
end$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- scroller_wiki_seeds — defines what the daily converter fetches
-- kind:
--   'random'   → pull N random articles from Wikipedia REST
--   'category' → pull pages whose category contains value (e.g. value='Physics')
--   'featured' → today's featured article (en.wp featured-content feed)
--   'pageid'   → fetch a specific pageid (value = numeric)
--   'title'    → fetch by exact title (value = string)
create table if not exists public.scroller_wiki_seeds (
  id text primary key,                             -- friendly id, e.g. 'random-daily', 'cat-physics'
  label text not null,
  kind text not null,
  value text,                                      -- category name / title / pageid (kind-dependent)
  lang text not null default 'en',
  max_pages integer not null default 25,
  priority integer not null default 100,
  enabled boolean not null default true,
  last_run_at timestamptz,
  last_run_count integer,
  last_run_status text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scroller_wiki_seeds_enabled_idx on public.scroller_wiki_seeds(enabled, priority);

-- ─────────────────────────────────────────────────────────────────────────────
-- scroller_wiki_log — per-run audit (one row per seed per run)
create table if not exists public.scroller_wiki_log (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  seed_id text,
  status text not null,                            -- 'ok' | 'partial' | 'error'
  fetched integer not null default 0,
  upserted integer not null default 0,
  failed integer not null default 0,
  message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists scroller_wiki_log_run_idx on public.scroller_wiki_log(run_id);
create index if not exists scroller_wiki_log_started_idx on public.scroller_wiki_log(started_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at trigger (shared with scroller_sites)
create or replace function public.set_updated_at_scroller()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists set_updated_at_scroller_wiki_index on public.scroller_wiki_index;
create trigger set_updated_at_scroller_wiki_index before update on public.scroller_wiki_index
  for each row execute function public.set_updated_at_scroller();

drop trigger if exists set_updated_at_scroller_wiki_seeds on public.scroller_wiki_seeds;
create trigger set_updated_at_scroller_wiki_seeds before update on public.scroller_wiki_seeds
  for each row execute function public.set_updated_at_scroller();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
alter table public.scroller_wiki_index enable row level security;
alter table public.scroller_wiki_seeds enable row level security;
alter table public.scroller_wiki_log enable row level security;

drop policy if exists "authed all scroller_wiki_index" on public.scroller_wiki_index;
create policy "authed all scroller_wiki_index" on public.scroller_wiki_index
  for all to authenticated using (true) with check (true);

drop policy if exists "authed all scroller_wiki_seeds" on public.scroller_wiki_seeds;
create policy "authed all scroller_wiki_seeds" on public.scroller_wiki_seeds
  for all to authenticated using (true) with check (true);

drop policy if exists "authed all scroller_wiki_log" on public.scroller_wiki_log;
create policy "authed all scroller_wiki_log" on public.scroller_wiki_log
  for all to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Default seeds (wikai-parity start; admin can flip kind+value to switch categories)
insert into public.scroller_wiki_seeds (id, label, kind, value, max_pages, priority, enabled) values
  ('random-daily',  'Random daily batch',                 'random',   null,         25,  10,  true),
  ('featured',      'Today featured article',             'featured', null,         1,   20,  true),
  ('cat-physics',   'Category: Physics',                  'category', 'Physics',    20,  30,  false),
  ('cat-philosophy','Category: Philosophy',               'category', 'Philosophy', 20,  40,  false),
  ('cat-software',  'Category: Software engineering',     'category', 'Software engineering', 20, 50, false),
  ('cat-cities',    'Category: Cities',                   'category', 'Cities',     20,  60,  false)
on conflict (id) do nothing;
