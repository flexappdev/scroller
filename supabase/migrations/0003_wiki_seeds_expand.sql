-- Expand wiki seed defaults so the daily converter populates the index faster.
-- Enables every default seed and raises max_pages so a single cron run lands
-- ~600 articles instead of the original ~46.

update public.scroller_wiki_seeds
set enabled = true, max_pages = 100
where id in (
  'random-daily',
  'cat-physics',
  'cat-philosophy',
  'cat-software',
  'cat-cities'
);

-- Add WikiVoyage seeds — same converter, lang remains 'en' but the storage
-- layer keys on category so these read as a distinct group on /wiki.
insert into public.scroller_wiki_seeds (id, label, kind, value, lang, max_pages, priority, enabled) values
  ('wikivoyage-random', 'WikiVoyage: random destinations', 'random',   null,         'en', 100, 100, true),
  ('wikivoyage-europe', 'WikiVoyage: Europe',              'category', 'Europe',     'en',  60, 110, true),
  ('wikivoyage-asia',   'WikiVoyage: Asia',                'category', 'Asia',       'en',  60, 120, true),
  ('wikivoyage-africa', 'WikiVoyage: Africa',              'category', 'Africa',     'en',  60, 130, true)
on conflict (id) do nothing;

-- New Wikipedia seeds to widen coverage on first run.
insert into public.scroller_wiki_seeds (id, label, kind, value, lang, max_pages, priority, enabled) values
  ('cat-mathematics', 'Category: Mathematics',           'category', 'Mathematics',           'en', 60, 70, true),
  ('cat-history',     'Category: History',               'category', 'History',               'en', 60, 75, true),
  ('cat-biology',     'Category: Biology',               'category', 'Biology',               'en', 60, 80, true),
  ('cat-art',         'Category: Art',                   'category', 'Art',                   'en', 60, 85, true),
  ('cat-music',       'Category: Music',                 'category', 'Music',                 'en', 60, 90, true)
on conflict (id) do nothing;
