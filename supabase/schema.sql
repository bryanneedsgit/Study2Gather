create extension if not exists postgis;

create table if not exists profiles (
  id uuid primary key,
  email text not null unique,
  school text not null,
  course text not null,
  age int not null check (age >= 16),
  age_range text not null,
  created_at timestamptz not null default now()
);

create table if not exists study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists group_memberships (
  group_id uuid not null references study_groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references study_groups(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  copresence_method text not null check (copresence_method in ('geofence', 'ble', 'mock')),
  created_at timestamptz not null default now()
);

create table if not exists rewards_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  session_id uuid not null references study_sessions(id) on delete cascade,
  points_awarded int not null check (points_awarded > 0),
  reason text not null check (reason = '60_min_focus_interval'),
  awarded_at timestamptz not null default now()
);

create table if not exists forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body_text text not null,
  created_at timestamptz not null default now(),
  constraint forum_posts_no_links check (body_text !~* '(https?://|www\\.)')
);

create table if not exists study_spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  geom geography(point, 4326) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_study_spots_geom on study_spots using gist (geom);

create view monthly_leaderboard as
select
  rl.user_id,
  to_char(date_trunc('month', rl.awarded_at), 'YYYY-MM') as month,
  sum(rl.points_awarded)::int as points
from rewards_ledger rl
group by rl.user_id, date_trunc('month', rl.awarded_at);
