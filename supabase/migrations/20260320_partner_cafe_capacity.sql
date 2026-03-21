-- Study2Gather: partner cafe capacity + reservation + coupon verification
-- Hackathon-safe: minimal schema, strong constraints, RPC-first backend logic.

-- 1) Extend existing study_spots as partner cafe inventory source.
alter table study_spots
  add column if not exists is_partner_cafe boolean not null default false,
  add column if not exists total_stipulated_tables int not null default 0 check (total_stipulated_tables >= 0),
  add column if not exists footfall_metric int not null default 0 check (footfall_metric >= 0),
  add column if not exists reduce_margin boolean not null default false;

-- 2) Status enums.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'seat_hold_purpose') then
    create type seat_hold_purpose as enum ('coupon_purchase', 'table_reservation');
  end if;
  if not exists (select 1 from pg_type where typname = 'seat_hold_status') then
    create type seat_hold_status as enum ('active', 'converted', 'released', 'expired');
  end if;
  if not exists (select 1 from pg_type where typname = 'purchase_status') then
    create type purchase_status as enum ('pending', 'paid', 'failed', 'timeout', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'presence_verification_method') then
    create type presence_verification_method as enum ('coupon_redeem', 'receipt_scan');
  end if;
end $$;

-- 3) Seat holds: 5-minute temporary lock.
create table if not exists cafe_seat_holds (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references study_spots(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  purpose seat_hold_purpose not null,
  status seat_hold_status not null default 'active',
  expires_at timestamptz not null,
  converted_at timestamptz,
  released_at timestamptz,
  release_reason text,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index if not exists idx_cafe_seat_holds_active
  on cafe_seat_holds (cafe_id, status, expires_at);
create index if not exists idx_cafe_seat_holds_user
  on cafe_seat_holds (user_id, created_at desc);

-- 4) Coupon purchases / table reservations.
create table if not exists cafe_purchases (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references study_spots(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  seat_hold_id uuid not null unique references cafe_seat_holds(id) on delete restrict,
  status purchase_status not null default 'pending',
  coupon_code text unique,
  confirmed_reservation boolean not null default false,
  margin_reduced boolean not null default false,
  tutor_rate_paid boolean not null default false,
  tutor_user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists idx_cafe_purchases_cafe_status
  on cafe_purchases (cafe_id, status, created_at desc);
create index if not exists idx_cafe_purchases_user
  on cafe_purchases (user_id, created_at desc);

-- 5) Presence verification logs.
create table if not exists cafe_presence_logs (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references study_spots(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  purchase_id uuid references cafe_purchases(id) on delete set null,
  method presence_verification_method not null,
  verified_at timestamptz not null default now(),
  note text
);

create index if not exists idx_cafe_presence_logs_cafe_time
  on cafe_presence_logs (cafe_id, verified_at desc);

-- 6) Tutor points grant audit.
create table if not exists tutor_points_rewards (
  id uuid primary key default gen_random_uuid(),
  tutor_user_id uuid not null references profiles(id) on delete cascade,
  source_purchase_id uuid not null unique references cafe_purchases(id) on delete cascade,
  points int not null check (points > 0),
  granted_at timestamptz not null default now(),
  reason text not null default 'competitive_tutor_rate'
);

-- 7) Occupancy view.
create or replace view cafe_capacity_snapshot as
select
  s.id as cafe_id,
  s.name as cafe_name,
  s.total_stipulated_tables,
  (
    coalesce((
      select count(*)::int
      from cafe_seat_holds h
      where h.cafe_id = s.id
        and h.status = 'active'
        and h.expires_at > now()
    ), 0)
    +
    coalesce((
      select count(*)::int
      from cafe_purchases p
      where p.cafe_id = s.id
        and p.status = 'paid'
        and p.confirmed_reservation = true
    ), 0)
  ) as current_occupied_tables
from study_spots s
where s.is_partner_cafe = true;

-- 8) RPC: availability check.
create or replace function check_cafe_availability(p_cafe_id uuid)
returns table (
  cafe_id uuid,
  total_stipulated_tables int,
  current_occupied_tables int,
  can_transact boolean
)
language sql
stable
as $$
  select
    c.cafe_id,
    c.total_stipulated_tables,
    c.current_occupied_tables,
    (c.current_occupied_tables < c.total_stipulated_tables) as can_transact
  from cafe_capacity_snapshot c
  where c.cafe_id = p_cafe_id;
$$;

-- 9) RPC: create 5-minute seat hold, guarded by capacity and row lock.
create or replace function create_seat_hold(
  p_cafe_id uuid,
  p_user_id uuid,
  p_purpose seat_hold_purpose
)
returns cafe_seat_holds
language plpgsql
as $$
declare
  v_total int;
  v_current int;
  v_hold cafe_seat_holds;
begin
  perform 1 from study_spots s where s.id = p_cafe_id and s.is_partner_cafe = true for update;

  select s.total_stipulated_tables into v_total
  from study_spots s
  where s.id = p_cafe_id;

  if v_total is null then
    raise exception 'cafe_not_found';
  end if;

  select
    (
      coalesce((
        select count(*)::int
        from cafe_seat_holds h
        where h.cafe_id = p_cafe_id
          and h.status = 'active'
          and h.expires_at > now()
      ), 0)
      +
      coalesce((
        select count(*)::int
        from cafe_purchases p
        where p.cafe_id = p_cafe_id
          and p.status = 'paid'
          and p.confirmed_reservation = true
      ), 0)
    )
  into v_current;

  if v_current >= v_total then
    raise exception 'cafe_full';
  end if;

  insert into cafe_seat_holds (cafe_id, user_id, purpose, expires_at)
  values (p_cafe_id, p_user_id, p_purpose, now() + interval '5 minutes')
  returning * into v_hold;

  return v_hold;
end;
$$;

-- 10) RPC: release expired holds (call from scheduled job / edge function).
create or replace function release_expired_seat_holds()
returns int
language plpgsql
as $$
declare
  v_count int;
begin
  update cafe_seat_holds
  set status = 'expired',
      released_at = now(),
      release_reason = 'hold_timeout'
  where status = 'active'
    and expires_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- 11) RPC: finalize purchase from hold.
create or replace function finalize_coupon_purchase(
  p_seat_hold_id uuid,
  p_payment_success boolean,
  p_coupon_code text default null,
  p_tutor_rate_paid boolean default false,
  p_tutor_user_id uuid default null
)
returns cafe_purchases
language plpgsql
as $$
declare
  v_hold cafe_seat_holds;
  v_purchase cafe_purchases;
  v_reduce_margin boolean;
begin
  select * into v_hold
  from cafe_seat_holds
  where id = p_seat_hold_id
  for update;

  if v_hold.id is null then
    raise exception 'hold_not_found';
  end if;

  if v_hold.status <> 'active' then
    raise exception 'hold_not_active';
  end if;

  if v_hold.expires_at <= now() then
    update cafe_seat_holds
    set status = 'expired', released_at = now(), release_reason = 'hold_timeout'
    where id = v_hold.id;
    raise exception 'hold_expired';
  end if;

  select s.reduce_margin into v_reduce_margin
  from study_spots s
  where s.id = v_hold.cafe_id;

  if p_payment_success then
    update cafe_seat_holds
    set status = 'converted', converted_at = now()
    where id = v_hold.id;

    insert into cafe_purchases (
      cafe_id, user_id, seat_hold_id, status, coupon_code, confirmed_reservation,
      margin_reduced, tutor_rate_paid, tutor_user_id, paid_at
    )
    values (
      v_hold.cafe_id, v_hold.user_id, v_hold.id, 'paid', p_coupon_code, true,
      coalesce(v_reduce_margin, false), p_tutor_rate_paid, p_tutor_user_id, now()
    )
    returning * into v_purchase;
  else
    update cafe_seat_holds
    set status = 'released', released_at = now(), release_reason = 'payment_failed'
    where id = v_hold.id;

    insert into cafe_purchases (
      cafe_id, user_id, seat_hold_id, status, coupon_code, confirmed_reservation,
      margin_reduced, tutor_rate_paid, tutor_user_id
    )
    values (
      v_hold.cafe_id, v_hold.user_id, v_hold.id, 'failed', p_coupon_code, false,
      coalesce(v_reduce_margin, false), p_tutor_rate_paid, p_tutor_user_id
    )
    returning * into v_purchase;
  end if;

  return v_purchase;
end;
$$;

-- 12) RPC: verify in-cafe presence by redeem/receipt scan.
create or replace function verify_cafe_presence(
  p_cafe_id uuid,
  p_user_id uuid,
  p_method presence_verification_method,
  p_purchase_id uuid default null,
  p_note text default null
)
returns cafe_presence_logs
language plpgsql
as $$
declare
  v_log cafe_presence_logs;
begin
  insert into cafe_presence_logs (cafe_id, user_id, method, purchase_id, note)
  values (p_cafe_id, p_user_id, p_method, p_purchase_id, p_note)
  returning * into v_log;

  return v_log;
end;
$$;

-- 13) RPC: tutor points reward for competitive tutor rate flow.
create or replace function grant_tutor_points_reward(
  p_source_purchase_id uuid,
  p_points int default 20
)
returns tutor_points_rewards
language plpgsql
as $$
declare
  v_purchase cafe_purchases;
  v_reward tutor_points_rewards;
begin
  select * into v_purchase
  from cafe_purchases
  where id = p_source_purchase_id
  for update;

  if v_purchase.id is null then
    raise exception 'purchase_not_found';
  end if;

  if not v_purchase.tutor_rate_paid or v_purchase.tutor_user_id is null then
    raise exception 'purchase_not_eligible_for_tutor_reward';
  end if;

  insert into tutor_points_rewards (tutor_user_id, source_purchase_id, points)
  values (v_purchase.tutor_user_id, v_purchase.id, p_points)
  on conflict (source_purchase_id) do nothing
  returning * into v_reward;

  if v_reward.id is null then
    select * into v_reward
    from tutor_points_rewards
    where source_purchase_id = p_source_purchase_id;
  end if;

  return v_reward;
end;
$$;
