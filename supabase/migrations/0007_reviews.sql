-- Reviews: quality AND punctuality rated separately (the product differentiator).
-- Insert allowed only for completed jobs — trigger-enforced in 0010, not UI-enforced.

create table reviews (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references jobs (id) on delete cascade,
  client_id uuid not null references profiles (id) on delete cascade,
  provider_id uuid not null references profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  punctuality_rating smallint not null check (punctuality_rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  -- UGC moderation (App Store 1.2): reports flip is_flagged + under_review.
  is_flagged boolean not null default false,
  moderation_status moderation_status not null default 'published',
  created_at timestamptz not null default now()
);

create index reviews_provider_idx on reviews (provider_id, created_at desc)
  where moderation_status = 'published';
