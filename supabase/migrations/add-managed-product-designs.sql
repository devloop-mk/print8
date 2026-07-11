-- Admin-managed merch / product designs (overrides static catalog + new designs)
create table if not exists public.managed_product_designs (
  id text primary key,
  template jsonb not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists managed_product_designs_active_idx
  on public.managed_product_designs (active);

create index if not exists managed_product_designs_sort_idx
  on public.managed_product_designs (sort_order);

grant all on table public.managed_product_designs to postgres, service_role;
grant select, insert, update, delete on table public.managed_product_designs to service_role;

-- Refresh PostgREST schema cache so the API sees the new table immediately
notify pgrst, 'reload schema';
