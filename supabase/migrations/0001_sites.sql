-- Scroller CMS schema (v1, sites + publish log)
-- scroller_* table prefix avoids collision with appai / yb100 / sp in the same Supabase project.
-- Source of truth = Supabase. AIDB.SCROLLER_sites stays as a write-through mirror via src/lib/cms/mongo-mirror.ts.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- scroller_sites — curated list of sites (the new /sites public page)
create table if not exists public.scroller_sites (
  id text primary key,                          -- slug, e.g. 'hn', 'lobsters'
  title text not null,
  url text not null,
  description text,
  category text not null default 'tech',        -- 'tech' | 'design' | 'travel' | 'news' | 'other'
  accent text,                                  -- hex colour, optional
  favicon_url text,
  status text not null default 'draft',         -- 'draft' | 'published'
  sort_order integer not null default 0,
  data jsonb not null default '{}'::jsonb,      -- overflow / future fields
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scroller_sites_status_idx on public.scroller_sites(status, sort_order);

-- ─────────────────────────────────────────────────────────────────────────────
-- scroller_publish_log — audit trail
create table if not exists public.scroller_publish_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                           -- 'site' | 'page'
  ref text not null,                            -- site id or page slug
  published_by text,
  published_at timestamptz not null default now(),
  status text not null,                         -- 'ok' | 'failed'
  message text
);

create index if not exists scroller_publish_log_kind_idx on public.scroller_publish_log(kind, published_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at trigger
create or replace function public.set_updated_at_scroller()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists set_updated_at_scroller_sites on public.scroller_sites;
create trigger set_updated_at_scroller_sites before update on public.scroller_sites
  for each row execute function public.set_updated_at_scroller();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — only authenticated users (the single allowed email enforced by middleware)
-- can read/write. Public reads use the service role through the /api/public/* layer
-- or the cmsAdmin() client in server components.
alter table public.scroller_sites enable row level security;
alter table public.scroller_publish_log enable row level security;

drop policy if exists "authed all scroller_sites" on public.scroller_sites;
create policy "authed all scroller_sites" on public.scroller_sites
  for all to authenticated using (true) with check (true);

drop policy if exists "authed all scroller_publish_log" on public.scroller_publish_log;
create policy "authed all scroller_publish_log" on public.scroller_publish_log
  for all to authenticated using (true) with check (true);

-- Optional seed (8 starter sites)
insert into public.scroller_sites (id, title, url, description, category, accent, status, sort_order) values
  ('hn', 'Hacker News', 'https://news.ycombinator.com', 'Tech & startup discussion.', 'tech', '#ff6600', 'published', 10),
  ('lobsters', 'Lobsters', 'https://lobste.rs', 'Computing-focused community.', 'tech', '#ac130d', 'published', 20),
  ('ph', 'Product Hunt', 'https://www.producthunt.com', 'New product launches.', 'tech', '#da552f', 'published', 30),
  ('gh-trending', 'GitHub Trending', 'https://github.com/trending', 'Repos trending today.', 'tech', '#10b981', 'published', 40),
  ('css-tricks', 'CSS-Tricks', 'https://css-tricks.com', 'Front-end web techniques.', 'design', '#e91e63', 'published', 50),
  ('a16z', 'a16z', 'https://a16z.com', 'Andreessen Horowitz long-form.', 'tech', '#1f2937', 'published', 60),
  ('stratechery', 'Stratechery', 'https://stratechery.com', 'Strategy + tech analysis.', 'tech', '#444', 'published', 70),
  ('atlas-obscura', 'Atlas Obscura', 'https://www.atlasobscura.com', 'Curious places worth scrolling.', 'travel', '#3b6e7f', 'published', 80)
on conflict (id) do nothing;
