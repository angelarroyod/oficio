-- Privacy refinement: is_blocked_pair(a, b) let any authenticated user probe
-- block relations between arbitrary third parties. Replace with
-- is_blocked_with(other), always anchored to the caller.

create or replace function is_blocked_with(other uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from blocked_users
    where (blocker_id = auth.uid() and blocked_id = other)
       or (blocker_id = other and blocked_id = auth.uid())
  );
$$;

revoke execute on function is_blocked_with(uuid) from public, anon;
grant execute on function is_blocked_with(uuid) to authenticated;

-- Recreate every policy that referenced the old helper.

drop policy "profiles_select" on profiles;
create policy "profiles_select" on profiles for select to authenticated
  using (deleted_at is null and not is_blocked_with(id));

drop policy "provider_details_select" on provider_details;
create policy "provider_details_select" on provider_details for select to authenticated
  using (not is_blocked_with(user_id));

drop policy "requests_select_provider_feed" on requests;
create policy "requests_select_provider_feed" on requests for select to authenticated
  using (
    auth_role() = 'provider'
    and not is_blocked_with(client_id)
    and (
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
      or exists (
        select 1 from quotes q
        where q.request_id = requests.id and q.provider_id = auth.uid()
      )
    )
  );

drop policy "quotes_insert_provider" on quotes;
create policy "quotes_insert_provider" on quotes for insert to authenticated
  with check (
    provider_id = auth.uid()
    and auth_role() = 'provider'
    and status = 'sent'
    and exists (
      select 1 from requests r
      where r.id = request_id
        and r.status in ('open', 'quoted')
        and not is_blocked_with(r.client_id)
    )
  );

drop policy "reviews_select_published" on reviews;
create policy "reviews_select_published" on reviews for select to authenticated
  using (
    (moderation_status = 'published' and not is_blocked_with(provider_id))
    or client_id = auth.uid()
    or provider_id = auth.uid()
  );

drop function is_blocked_pair(uuid, uuid);
