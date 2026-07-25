-- Quotes: the central object of the product. Labor and materials broken out
-- per line item, IVA separate, explicit validity window.

create table quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests (id) on delete cascade,
  provider_id uuid not null references profiles (id) on delete cascade,
  -- [{concept, qty, unit_price, type: 'labor'|'material'}] — pesos, validated in 0010.
  line_items jsonb not null,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  iva numeric(12, 2) not null check (iva >= 0),
  total numeric(12, 2) not null check (total >= 0),
  estimated_duration_minutes integer not null check (estimated_duration_minutes between 15 and 2880),
  notes text check (char_length(notes) <= 1000),
  valid_until timestamptz not null,
  status quote_status not null default 'sent',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  -- One live quote per provider per request.
  constraint quotes_one_per_provider unique (request_id, provider_id)
);

comment on column quotes.valid_until is 'Acceptance after this instant is rejected by accept_quote(); shown as vigencia.';

create index quotes_request_idx on quotes (request_id, created_at desc);
create index quotes_provider_idx on quotes (provider_id, status, created_at desc);
