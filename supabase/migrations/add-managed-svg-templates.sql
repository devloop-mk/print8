-- Admin-editable default text, colors, and layout for SVG design templates
create table if not exists public.managed_svg_templates (
  template_id text primary key,
  defaults jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists managed_svg_templates_updated_idx
  on public.managed_svg_templates (updated_at desc);

grant all on table public.managed_svg_templates to postgres, service_role;
grant select, insert, update, delete on table public.managed_svg_templates to service_role;

notify pgrst, 'reload schema';
