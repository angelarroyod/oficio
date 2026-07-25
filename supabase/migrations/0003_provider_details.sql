-- Provider-only extension of profiles: trades, zone, verification, public metrics.

create table provider_details (
  user_id uuid primary key references profiles (id) on delete cascade,
  trades trade_type[] not null default '{}',
  service_radius_km numeric(5, 1) not null default 10 check (service_radius_km between 1 and 100),
  bio text check (char_length(bio) <= 600),
  rfc text check (rfc ~* '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$'),
  rfc_status rfc_status not null default 'none',
  verification_level verification_level not null default 'basic',
  -- Computed metrics: never client-writable (enforced by trigger in 0010).
  punctuality_score numeric(5, 2) check (punctuality_score between 0 and 100),
  completion_rate numeric(5, 2) check (completion_rate between 0 and 100),
  avg_response_minutes numeric(8, 1),
  dispute_rate numeric(5, 2) check (dispute_rate between 0 and 100),
  -- Premium is sold on the web; the app only reads these flags.
  is_premium boolean not null default false,
  premium_until timestamptz,
  -- Provider base location anchors the service-radius circle.
  base_lat double precision,
  base_lng double precision
);

comment on column provider_details.punctuality_score is 'Percent of completed jobs arriving within window. Recomputed by trigger only.';
comment on column provider_details.is_premium is 'Set out-of-band (web sale). Never sold or promoted in-app (App Store 3.1.3(b)).';

create index provider_details_trades_idx on provider_details using gin (trades);
