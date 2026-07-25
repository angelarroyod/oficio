-- Jobs: an accepted quote scheduled into an arrival WINDOW (never an exact time).
-- Created exclusively by accept_quote(); no direct insert path for clients.

create table jobs (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null unique references quotes (id) on delete restrict,
  client_id uuid not null references profiles (id) on delete cascade,
  provider_id uuid not null references profiles (id) on delete cascade,
  window_start timestamptz not null,
  window_end timestamptz not null,
  status job_status not null default 'scheduled',
  actual_arrival_at timestamptz,
  completed_at timestamptz,
  completion_photos text[] not null default '{}' check (cardinality(completion_photos) <= 10),
  cancellation_reason text check (char_length(cancellation_reason) <= 500),
  created_at timestamptz not null default now(),
  constraint jobs_window_valid check (window_end > window_start),
  -- 2-hour arrival windows are the product decision; tolerate up to 4h for flexibility.
  constraint jobs_window_length check (window_end - window_start <= interval '4 hours')
);

comment on column jobs.actual_arrival_at is 'Set when provider marks en sitio. Feeds punctuality_score vs window_end.';

create index jobs_client_idx on jobs (client_id, status, window_start);
create index jobs_provider_idx on jobs (provider_id, status, window_start);
create index jobs_provider_day_idx on jobs (provider_id, window_start) where status in ('scheduled', 'en_route', 'in_progress');
