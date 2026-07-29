-- Per-SKU storefront visibility (blank products from catalog.ts).
-- Missing rows default to visible; active = false hides from browse/nav/detail.

create table if not exists public.cms_product_visibility (
  product_id text primary key,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists cms_product_visibility_active_idx
  on public.cms_product_visibility (active);

grant all on table public.cms_product_visibility to postgres, service_role;
grant select, insert, update, delete on table public.cms_product_visibility to service_role;

-- Hide hoodies until stock is available (toggle back on in admin → Редослед).
insert into public.cms_product_visibility (product_id, active, updated_at)
values ('hoodie-basic', false, now())
on conflict (product_id) do update
  set active = excluded.active,
      updated_at = excluded.updated_at;
