-- Row Level Security: every table locked down; anon key exposes nothing
-- beyond these policies. Helper functions are SECURITY DEFINER to avoid
-- recursive policy evaluation.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function auth_role()
returns user_role
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select role from profiles where id = auth.uid() and deleted_at is null;
$$;

-- True when either party has blocked the other.
create or replace function is_blocked_pair(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from blocked_users
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;

create policy "profiles_select" on profiles for select to authenticated
  using (
    deleted_at is null
    and not is_blocked_pair(id, auth.uid())
  );

create policy "profiles_insert_own" on profiles for insert to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own" on profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- No delete policy: account deletion goes through a definer function (Sprint 4).

-- ---------------------------------------------------------------------------
-- provider_details — public trust metrics, owner-managed basics.
-- ---------------------------------------------------------------------------
alter table provider_details enable row level security;

create policy "provider_details_select" on provider_details for select to authenticated
  using (not is_blocked_pair(user_id, auth.uid()));

create policy "provider_details_insert_own" on provider_details for insert to authenticated
  with check (user_id = auth.uid() and auth_role() = 'provider');

create policy "provider_details_update_own" on provider_details for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
  -- Protected columns additionally guarded by trigger in 0010.

-- ---------------------------------------------------------------------------
-- requests — clients own theirs; providers see open work in trade + radius,
-- plus any request they already quoted.
-- ---------------------------------------------------------------------------
alter table requests enable row level security;

create policy "requests_select_own" on requests for select to authenticated
  using (client_id = auth.uid());

create policy "requests_select_provider_feed" on requests for select to authenticated
  using (
    auth_role() = 'provider'
    and not is_blocked_pair(client_id, auth.uid())
    and (
      -- open opportunities in my trades within my service radius
      (
        status in ('open', 'quoted')
        and exists (
          select 1 from provider_details pd
          where pd.user_id = auth.uid()
            and requests.trade = any (pd.trades)
            and pd.base_lat is not null
            and earth_distance(
                  ll_to_earth(pd.base_lat, pd.base_lng),
                  ll_to_earth(requests.lat, requests.lng)
                ) <= pd.service_radius_km * 1000
        )
      )
      -- or anything I have already quoted (keep visibility through lifecycle)
      or exists (
        select 1 from quotes q
        where q.request_id = requests.id and q.provider_id = auth.uid()
      )
    )
  );

create policy "requests_insert_client" on requests for insert to authenticated
  with check (
    client_id = auth.uid()
    and auth_role() = 'client'
    and status = 'open'
  );

create policy "requests_update_own" on requests for update to authenticated
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- ---------------------------------------------------------------------------
-- quotes — provider writes own; request owner reads all quotes on the request.
-- Acceptance only via accept_quote() (definer), never direct update.
-- ---------------------------------------------------------------------------
alter table quotes enable row level security;

create policy "quotes_select_provider_own" on quotes for select to authenticated
  using (provider_id = auth.uid());

create policy "quotes_select_request_owner" on quotes for select to authenticated
  using (
    exists (
      select 1 from requests r
      where r.id = quotes.request_id and r.client_id = auth.uid()
    )
  );

create policy "quotes_insert_provider" on quotes for insert to authenticated
  with check (
    provider_id = auth.uid()
    and auth_role() = 'provider'
    and status = 'sent'
    and exists (
      select 1 from requests r
      where r.id = request_id
        and r.status in ('open', 'quoted')
        and not is_blocked_pair(r.client_id, auth.uid())
    )
  );

-- Providers may only withdraw their own sent quotes.
create policy "quotes_withdraw_provider" on quotes for update to authenticated
  using (provider_id = auth.uid() and status = 'sent')
  with check (provider_id = auth.uid() and status in ('sent', 'withdrawn'));

-- ---------------------------------------------------------------------------
-- jobs — visible to both parties; created only by accept_quote() (definer
-- bypasses RLS, so no insert policy exists at all).
-- ---------------------------------------------------------------------------
alter table jobs enable row level security;

create policy "jobs_select_parties" on jobs for select to authenticated
  using (client_id = auth.uid() or provider_id = auth.uid());

-- Provider drives the state machine; client may cancel while scheduled.
-- Transition legality lives in the 0010 trigger.
create policy "jobs_update_provider" on jobs for update to authenticated
  using (provider_id = auth.uid())
  with check (provider_id = auth.uid());

create policy "jobs_update_client_cancel" on jobs for update to authenticated
  using (client_id = auth.uid() and status = 'scheduled')
  with check (client_id = auth.uid() and status in ('scheduled', 'cancelled'));

-- ---------------------------------------------------------------------------
-- reviews — published ones are public trust data; authors always see theirs.
-- ---------------------------------------------------------------------------
alter table reviews enable row level security;

create policy "reviews_select_published" on reviews for select to authenticated
  using (
    (moderation_status = 'published' and not is_blocked_pair(provider_id, auth.uid()))
    or client_id = auth.uid()
    or provider_id = auth.uid()
  );

create policy "reviews_insert_client" on reviews for insert to authenticated
  with check (client_id = auth.uid() and auth_role() = 'client');
  -- Completed-job + party-match rules enforced by trigger in 0010.

-- No author update/delete in MVP; moderation happens via service role.

-- ---------------------------------------------------------------------------
-- provider_finance — Premium feature, owner-only, every operation.
-- ---------------------------------------------------------------------------
alter table provider_finance enable row level security;

create policy "finance_all_premium_owner" on provider_finance for all to authenticated
  using (
    provider_id = auth.uid()
    and exists (
      select 1 from provider_details pd
      where pd.user_id = auth.uid() and pd.is_premium
    )
  )
  with check (
    provider_id = auth.uid()
    and exists (
      select 1 from provider_details pd
      where pd.user_id = auth.uid() and pd.is_premium
    )
  );

-- ---------------------------------------------------------------------------
-- blocked_users — each user manages their own block list.
-- ---------------------------------------------------------------------------
alter table blocked_users enable row level security;

create policy "blocked_select_own" on blocked_users for select to authenticated
  using (blocker_id = auth.uid());

create policy "blocked_insert_own" on blocked_users for insert to authenticated
  with check (blocker_id = auth.uid());

create policy "blocked_delete_own" on blocked_users for delete to authenticated
  using (blocker_id = auth.uid());

-- ---------------------------------------------------------------------------
-- reports — write-and-forget for users; triage via service role.
-- ---------------------------------------------------------------------------
alter table reports enable row level security;

create policy "reports_select_own" on reports for select to authenticated
  using (reporter_id = auth.uid());

create policy "reports_insert_own" on reports for insert to authenticated
  with check (reporter_id = auth.uid());
