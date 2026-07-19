-- Spin-the-wheel plays: one play per email, optional one-time coupon.

create table if not exists public.spin_plays (
  id text primary key,
  email text not null,
  email_normalized text not null,
  prize_key text not null,
  discount_amount integer not null default 0 check (discount_amount >= 0),
  coupon_id text references public.coupons (id) on delete set null,
  coupon_code text,
  ip_hash text,
  user_agent_hash text,
  locale text,
  created_at timestamptz not null default now()
);

create unique index if not exists spin_plays_email_normalized_uidx
  on public.spin_plays (email_normalized);

create index if not exists spin_plays_created_at_idx
  on public.spin_plays (created_at desc);

comment on table public.spin_plays is 'Temu-style wheel: one spin per email forever';
comment on column public.spin_plays.email_normalized is 'lower(trim(email)) for uniqueness';

grant all on table public.spin_plays to postgres, service_role;
grant select, insert, update, delete on table public.spin_plays to service_role;
