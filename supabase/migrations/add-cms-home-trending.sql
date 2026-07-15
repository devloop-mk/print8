-- Homepage trending product design picks (t-shirt / streetwear mockups)
create table if not exists public.cms_home_trending (
  design_id text primary key,
  sort_order integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists cms_home_trending_sort_idx
  on public.cms_home_trending (sort_order asc);

grant all on table public.cms_home_trending to postgres, service_role;
grant select, insert, update, delete on table public.cms_home_trending to service_role;

notify pgrst, 'reload schema';
