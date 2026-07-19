-- Contact messages from the public contact form (admin inbox).
create table if not exists public.contact_messages (
  id text primary key,
  name text not null,
  email text not null,
  message text not null,
  locale text,
  status text not null default 'new',
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_status_idx
  on public.contact_messages (status);

grant all on table public.contact_messages to postgres, service_role;
grant select, insert, update, delete on table public.contact_messages to service_role;

-- Order fulfillment: cargo delivery (default) or store pickup.
alter table public.orders
  add column if not exists fulfillment_method text not null default 'cargo';

comment on column public.orders.fulfillment_method is
  'cargo = nationwide cargo delivery; pickup = store pickup in Shtip';
