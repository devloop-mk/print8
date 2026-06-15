-- Page view analytics for admin dashboard
create table if not exists public.page_views (
  id text primary key,
  path text not null,
  locale text,
  visitor_id text not null,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_at_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx on public.page_views (path);
create index if not exists page_views_visitor_id_idx on public.page_views (visitor_id);
