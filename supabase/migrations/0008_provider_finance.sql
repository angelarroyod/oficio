-- Premium-only income/expense ledger. RLS gates every operation on is_premium.

create table provider_finance (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references profiles (id) on delete cascade,
  type finance_entry_type not null,
  amount numeric(12, 2) not null check (amount > 0),
  category text not null check (char_length(category) between 2 and 60),
  receipt_url text,
  job_id uuid references jobs (id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index provider_finance_idx on provider_finance (provider_id, occurred_at desc);
