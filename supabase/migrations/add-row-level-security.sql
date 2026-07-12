-- Block direct PostgREST access for anon/authenticated roles.
-- The Next.js app uses the service_role key via getSupabaseAdmin().

alter table if exists public.upload_sessions enable row level security;
alter table if exists public.uploaded_files enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.page_views enable row level security;
alter table if exists public.catalog_designs enable row level security;
alter table if exists public.cms_content enable row level security;
alter table if exists public.cms_services enable row level security;
alter table if exists public.managed_product_designs enable row level security;
