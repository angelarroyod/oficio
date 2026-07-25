-- Service requests: the entry point of the transactional spine.
-- Deviations from original brief (locked in design review):
--   * ai_* columns dropped (AI estimation deferred out of MVP).
--   * visit_type added (diagnostic visits are short predictable blocks).

create table requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles (id) on delete cascade,
  trade trade_type not null,
  visit_type visit_type not null default 'full_service',
  title text not null check (char_length(title) between 4 and 120),
  description text not null check (char_length(description) between 10 and 2000),
  photos text[] not null default '{}' check (cardinality(photos) <= 6),
  address_text text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  urgency request_urgency not null default 'flexible',
  status request_status not null default 'open',
  created_at timestamptz not null default now()
);

comment on table requests is 'Client problem descriptions broadcast to providers of the matching trade and zone.';

create index requests_client_idx on requests (client_id, created_at desc);
create index requests_open_by_trade_idx on requests (trade, created_at desc) where status = 'open';
-- Supports the earth_box radius filter used by the provider opportunity feed.
create index requests_earth_idx on requests using gist (ll_to_earth(lat, lng));
