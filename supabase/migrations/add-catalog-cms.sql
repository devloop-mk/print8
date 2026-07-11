-- Catalog designs CMS + exclusive inventory
create table if not exists public.catalog_designs (
  id text primary key,
  category text not null,
  kind text not null default 'fixed',
  image text not null,
  tags jsonb not null default '[]'::jsonb,
  thumb_aspect numeric,
  exclusive boolean not null default false,
  availability text not null default 'available',
  reserved_order_id text references public.orders (id) on delete set null,
  sold_order_id text references public.orders (id) on delete set null,
  price numeric,
  sort_order integer not null default 0,
  name_en text not null,
  name_mk text not null,
  description_en text,
  description_mk text,
  svg_template_id text,
  layout_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_designs_availability_check check (
    availability in ('available', 'reserved', 'sold', 'draft', 'archived')
  ),
  constraint catalog_designs_kind_check check (kind in ('fixed', 'customizable'))
);

create index if not exists catalog_designs_category_idx on public.catalog_designs (category);
create index if not exists catalog_designs_availability_idx on public.catalog_designs (availability);
create index if not exists catalog_designs_exclusive_idx on public.catalog_designs (exclusive);

-- Editable site content (hero text, contact info, etc.)
create table if not exists public.cms_content (
  key text primary key,
  section text not null default 'general',
  label text not null,
  value_en text not null default '',
  value_mk text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists cms_content_section_idx on public.cms_content (section);

-- Service catalog overrides
create table if not exists public.cms_services (
  id text primary key,
  title_en text not null,
  title_mk text not null,
  description_en text not null default '',
  description_mk text not null default '',
  detail_en text not null default '',
  detail_mk text not null default '',
  starting_price numeric not null default 0,
  featured boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
