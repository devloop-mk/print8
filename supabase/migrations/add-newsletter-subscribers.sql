-- Newsletter subscribers (opt-in email list for admin broadcasts).
create table if not exists public.newsletter_subscribers (
  id text primary key,
  email text not null,
  locale text,
  status text not null default 'active',
  unsubscribe_token text not null unique,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create unique index if not exists newsletter_subscribers_email_idx
  on public.newsletter_subscribers (lower(email));

create index if not exists newsletter_subscribers_status_idx
  on public.newsletter_subscribers (status);

create index if not exists newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers (created_at desc);

grant all on table public.newsletter_subscribers to postgres, service_role;
grant select, insert, update, delete on table public.newsletter_subscribers to service_role;
