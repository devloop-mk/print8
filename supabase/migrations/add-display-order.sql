-- Admin-controlled storefront listing order for products and product designs.
-- Run this in the Supabase SQL Editor before using /admin/ordering.

create table if not exists public.cms_product_display_order (
  product_id text primary key,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists cms_product_display_order_sort_idx
  on public.cms_product_display_order (sort_order asc);

grant all on table public.cms_product_display_order to postgres, service_role;
grant select, insert, update, delete on table public.cms_product_display_order to service_role;

create table if not exists public.cms_design_display_order (
  design_id text primary key,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists cms_design_display_order_sort_idx
  on public.cms_design_display_order (sort_order asc);

grant all on table public.cms_design_display_order to postgres, service_role;
grant select, insert, update, delete on table public.cms_design_display_order to service_role;

notify pgrst, 'reload schema';
