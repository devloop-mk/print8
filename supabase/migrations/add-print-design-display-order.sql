-- Admin-controlled storefront order for print designs (wedding, business cards, menus, etc.).
-- Run in the Supabase SQL Editor before using the "Печатени дизајни" tab on /admin/ordering.

create table if not exists public.cms_print_design_display_order (
  design_id text primary key,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists cms_print_design_display_order_sort_idx
  on public.cms_print_design_display_order (sort_order asc);

grant all on table public.cms_print_design_display_order to postgres, service_role;
grant select, insert, update, delete on table public.cms_print_design_display_order to service_role;

notify pgrst, 'reload schema';
