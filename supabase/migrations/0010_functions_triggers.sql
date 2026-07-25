-- Business rules enforced in the database, not the UI.
-- All SECURITY DEFINER functions pin search_path to prevent hijacking.

-- ---------------------------------------------------------------------------
-- profiles: role is immutable after creation.
-- ---------------------------------------------------------------------------
create or replace function enforce_profile_immutables()
returns trigger
language plpgsql
as $$
begin
  if new.role <> old.role then
    raise exception 'role is immutable';
  end if;
  if new.created_at <> old.created_at then
    raise exception 'created_at is immutable';
  end if;
  return new;
end;
$$;

create trigger profiles_immutables
  before update on profiles
  for each row execute function enforce_profile_immutables();

-- ---------------------------------------------------------------------------
-- provider_details: computed metrics and ops-managed flags are never
-- client-writable. System paths set oficio.system_update before writing.
-- ---------------------------------------------------------------------------
create or replace function enforce_provider_protected_columns()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('oficio.system_update', true), '') = 'on' then
    return new;
  end if;
  if new.punctuality_score  is distinct from old.punctuality_score
  or new.completion_rate    is distinct from old.completion_rate
  or new.avg_response_minutes is distinct from old.avg_response_minutes
  or new.dispute_rate       is distinct from old.dispute_rate
  or new.rfc_status         is distinct from old.rfc_status
  or new.verification_level is distinct from old.verification_level
  or new.is_premium         is distinct from old.is_premium
  or new.premium_until      is distinct from old.premium_until then
    raise exception 'computed/ops columns are not client-writable';
  end if;
  return new;
end;
$$;

create trigger provider_details_protected
  before update on provider_details
  for each row execute function enforce_provider_protected_columns();

-- ---------------------------------------------------------------------------
-- quotes: validate line_items shape and totals consistency on write.
-- ---------------------------------------------------------------------------
create or replace function validate_quote()
returns trigger
language plpgsql
as $$
declare
  item jsonb;
  computed_subtotal numeric(12, 2) := 0;
begin
  if jsonb_typeof(new.line_items) <> 'array' or jsonb_array_length(new.line_items) = 0 then
    raise exception 'line_items must be a non-empty array';
  end if;

  for item in select * from jsonb_array_elements(new.line_items) loop
    if not (item ? 'concept' and item ? 'qty' and item ? 'unit_price' and item ? 'type') then
      raise exception 'each line item needs concept, qty, unit_price, type';
    end if;
    if item->>'type' not in ('labor', 'material') then
      raise exception 'line item type must be labor or material';
    end if;
    if (item->>'qty')::numeric <= 0 or (item->>'unit_price')::numeric < 0 then
      raise exception 'line item qty must be > 0 and unit_price >= 0';
    end if;
    computed_subtotal := computed_subtotal
      + round((item->>'qty')::numeric * (item->>'unit_price')::numeric, 2);
  end loop;

  if abs(new.subtotal - computed_subtotal) > 0.01 then
    raise exception 'subtotal does not match line items';
  end if;
  if abs(new.iva - round(new.subtotal * 0.16, 2)) > 0.01 then
    raise exception 'iva must be 16%% of subtotal';
  end if;
  if abs(new.total - (new.subtotal + new.iva)) > 0.01 then
    raise exception 'total must equal subtotal + iva';
  end if;
  if tg_op = 'INSERT' and new.valid_until <= now() then
    raise exception 'valid_until must be in the future';
  end if;
  return new;
end;
$$;

create trigger quotes_validate
  before insert or update on quotes
  for each row execute function validate_quote();

-- ---------------------------------------------------------------------------
-- quotes: first quote flips request open -> quoted; keep avg_response_minutes.
-- ---------------------------------------------------------------------------
create or replace function after_quote_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  req requests%rowtype;
begin
  select * into req from requests where id = new.request_id;

  update requests
    set status = 'quoted'
    where id = new.request_id and status = 'open';

  -- Rolling average of minutes from request creation to each of the provider's quotes.
  perform set_config('oficio.system_update', 'on', true);
  update provider_details pd
    set avg_response_minutes = sub.avg_minutes
    from (
      select round(avg(extract(epoch from (q.created_at - r.created_at)) / 60)::numeric, 1) as avg_minutes
      from quotes q
      join requests r on r.id = q.request_id
      where q.provider_id = new.provider_id
    ) sub
    where pd.user_id = new.provider_id;
  perform set_config('oficio.system_update', 'off', true);

  return new;
end;
$$;

create trigger quotes_after_insert
  after insert on quotes
  for each row execute function after_quote_insert();

-- ---------------------------------------------------------------------------
-- accept_quote: THE atomic transaction of the spine.
-- Client accepts one quote -> siblings rejected, request accepted, job created
-- with an arrival window. All-or-nothing; race-safe via row lock.
-- ---------------------------------------------------------------------------
create or replace function accept_quote(
  p_quote_id uuid,
  p_window_start timestamptz,
  p_window_end timestamptz
)
returns jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  q quotes%rowtype;
  req requests%rowtype;
  new_job jobs%rowtype;
begin
  select * into q from quotes where id = p_quote_id for update;
  if not found then
    raise exception 'quote not found';
  end if;

  select * into req from requests where id = q.request_id for update;

  if req.client_id <> auth.uid() then
    raise exception 'only the request owner can accept a quote';
  end if;
  if req.status not in ('open', 'quoted') then
    raise exception 'request is no longer open';
  end if;
  if q.status <> 'sent' then
    raise exception 'quote is not acceptable (status: %)', q.status;
  end if;
  if q.valid_until < now() then
    update quotes set status = 'expired' where id = q.id;
    raise exception 'quote has expired';
  end if;
  if p_window_end <= p_window_start
     or p_window_end - p_window_start > interval '4 hours'
     or p_window_start < now() then
    raise exception 'invalid arrival window';
  end if;

  update quotes set status = 'accepted', responded_at = now() where id = q.id;
  update quotes
    set status = 'rejected', responded_at = now()
    where request_id = q.request_id and id <> q.id and status = 'sent';
  update requests set status = 'accepted' where id = q.request_id;

  insert into jobs (quote_id, client_id, provider_id, window_start, window_end)
    values (q.id, req.client_id, q.provider_id, p_window_start, p_window_end)
    returning * into new_job;

  return new_job;
end;
$$;

-- ---------------------------------------------------------------------------
-- jobs: legal state-machine transitions only; stamp arrival/completion times.
--   scheduled -> en_route -> in_progress -> completed
--   scheduled | en_route -> cancelled (with reason)
-- ---------------------------------------------------------------------------
create or replace function enforce_job_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if not (
    (old.status = 'scheduled'   and new.status in ('en_route', 'cancelled')) or
    (old.status = 'en_route'    and new.status in ('in_progress', 'cancelled')) or
    (old.status = 'in_progress' and new.status = 'completed')
  ) then
    raise exception 'illegal job transition % -> %', old.status, new.status;
  end if;

  if new.status = 'in_progress' and new.actual_arrival_at is null then
    new.actual_arrival_at := now();
  end if;
  if new.status = 'completed' then
    if cardinality(new.completion_photos) = 0 then
      raise exception 'completion requires at least one photo';
    end if;
    new.completed_at := coalesce(new.completed_at, now());
  end if;
  if new.status = 'cancelled' and coalesce(new.cancellation_reason, '') = '' then
    raise exception 'cancellation requires a reason';
  end if;

  return new;
end;
$$;

create trigger jobs_transition
  before update on jobs
  for each row execute function enforce_job_transition();

-- ---------------------------------------------------------------------------
-- jobs: recompute provider public metrics when a job reaches a terminal state.
-- punctuality = % of completed jobs with arrival inside the window.
-- ---------------------------------------------------------------------------
create or replace function recalc_provider_metrics()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status not in ('completed', 'cancelled') then
    return new;
  end if;

  perform set_config('oficio.system_update', 'on', true);
  update provider_details pd
    set punctuality_score = sub.punctuality,
        completion_rate = sub.completion
    from (
      select
        round(100.0 * count(*) filter (
          where status = 'completed' and actual_arrival_at <= window_end
        ) / nullif(count(*) filter (where status = 'completed'), 0), 2) as punctuality,
        round(100.0 * count(*) filter (where status = 'completed')
          / nullif(count(*) filter (where status in ('completed', 'cancelled')), 0), 2) as completion
      from jobs
      where provider_id = new.provider_id
    ) sub
    where pd.user_id = new.provider_id;
  perform set_config('oficio.system_update', 'off', true);

  return new;
end;
$$;

create trigger jobs_metrics
  after update on jobs
  for each row execute function recalc_provider_metrics();

-- ---------------------------------------------------------------------------
-- reviews: only the client of a COMPLETED job may review it.
-- ---------------------------------------------------------------------------
create or replace function enforce_review_rules()
returns trigger
language plpgsql
as $$
declare
  j jobs%rowtype;
begin
  select * into j from jobs where id = new.job_id;
  if not found then
    raise exception 'job not found';
  end if;
  if j.status <> 'completed' then
    raise exception 'reviews are only allowed for completed jobs';
  end if;
  if j.client_id <> new.client_id or j.provider_id <> new.provider_id then
    raise exception 'review parties must match the job';
  end if;
  return new;
end;
$$;

create trigger reviews_guard
  before insert on reviews
  for each row execute function enforce_review_rules();

-- ---------------------------------------------------------------------------
-- Lazy expiry: mark stale sent quotes as expired. Called by clients before
-- listing quotes; idempotent. (pg_cron can take over post-MVP.)
-- ---------------------------------------------------------------------------
create or replace function expire_stale_quotes()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update quotes set status = 'expired'
    where status = 'sent' and valid_until < now();
$$;
