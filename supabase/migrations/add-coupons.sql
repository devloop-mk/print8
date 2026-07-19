-- Coupons: public site codes + single-use reward codes issued after spend thresholds.

alter table public.orders
  add column if not exists coupon_code text,
  add column if not exists discount_amount numeric not null default 0,
  add column if not exists subtotal_amount numeric;

comment on column public.orders.coupon_code is 'Applied coupon code (normalized), if any';
comment on column public.orders.discount_amount is 'Discount applied in MKD (server-validated)';
comment on column public.orders.subtotal_amount is 'Pre-discount merchandise total in MKD';

create table if not exists public.coupons (
  id text primary key,
  code text not null,
  kind text not null default 'public',
  discount_amount numeric not null check (discount_amount > 0),
  min_order_amount numeric not null default 0 check (min_order_amount >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  max_redemptions_per_day integer check (max_redemptions_per_day is null or max_redemptions_per_day > 0),
  max_redemptions_total integer check (max_redemptions_total is null or max_redemptions_total > 0),
  active boolean not null default true,
  issued_to_email text,
  issued_from_order_id text,
  note text,
  created_at timestamptz not null default now(),
  constraint coupons_kind_check check (kind in ('public', 'reward_issued'))
);

create unique index if not exists coupons_code_unique_idx
  on public.coupons (lower(code));

create index if not exists coupons_kind_active_idx
  on public.coupons (kind, active);

create index if not exists coupons_ends_at_idx
  on public.coupons (ends_at);

create table if not exists public.coupon_redemptions (
  id text primary key,
  coupon_id text not null references public.coupons (id) on delete restrict,
  order_id text not null references public.orders (id) on delete cascade,
  order_number text not null,
  discount_amount numeric not null check (discount_amount >= 0),
  customer_email text,
  customer_phone text,
  created_at timestamptz not null default now()
);

create unique index if not exists coupon_redemptions_order_id_idx
  on public.coupon_redemptions (order_id);

create index if not exists coupon_redemptions_coupon_day_idx
  on public.coupon_redemptions (coupon_id, created_at desc);

create table if not exists public.coupon_reward_tiers (
  id text primary key,
  min_spend numeric not null check (min_spend > 0),
  reward_amount numeric not null check (reward_amount > 0),
  reward_min_order_amount numeric not null default 0 check (reward_min_order_amount >= 0),
  reward_valid_days integer not null default 30 check (reward_valid_days > 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists coupon_reward_tiers_active_spend_idx
  on public.coupon_reward_tiers (active, min_spend desc);

-- Default reward tiers (safe to re-run: skip if already present)
insert into public.coupon_reward_tiers (
  id, min_spend, reward_amount, reward_min_order_amount, reward_valid_days, active, sort_order
)
select 'tier-3000', 3000, 500, 0, 60, true, 10
where not exists (select 1 from public.coupon_reward_tiers where id = 'tier-3000');

insert into public.coupon_reward_tiers (
  id, min_spend, reward_amount, reward_min_order_amount, reward_valid_days, active, sort_order
)
select 'tier-5500', 5500, 1000, 0, 60, true, 20
where not exists (select 1 from public.coupon_reward_tiers where id = 'tier-5500');

insert into public.coupon_reward_tiers (
  id, min_spend, reward_amount, reward_min_order_amount, reward_valid_days, active, sort_order
)
select 'tier-9000', 9000, 1800, 0, 60, true, 30
where not exists (select 1 from public.coupon_reward_tiers where id = 'tier-9000');

grant all on table public.coupons to postgres, service_role;
grant select, insert, update, delete on table public.coupons to service_role;

grant all on table public.coupon_redemptions to postgres, service_role;
grant select, insert, update, delete on table public.coupon_redemptions to service_role;

grant all on table public.coupon_reward_tiers to postgres, service_role;
grant select, insert, update, delete on table public.coupon_reward_tiers to service_role;
