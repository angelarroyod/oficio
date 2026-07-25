-- Safety tables (App Store 1.2): user blocking and content reporting.

create table blocked_users (
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocked_users_not_self check (blocker_id <> blocked_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id) on delete cascade,
  target_type report_target_type not null,
  target_id uuid not null,
  reason text not null check (char_length(reason) between 4 and 500),
  created_at timestamptz not null default now()
);

create index reports_target_idx on reports (target_type, target_id);
