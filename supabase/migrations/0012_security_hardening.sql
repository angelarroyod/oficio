-- Hardening pass driven by Supabase security advisor findings.

-- 1) Pin search_path on all non-definer trigger functions.
alter function enforce_profile_immutables() set search_path = public, pg_temp;
alter function enforce_provider_protected_columns() set search_path = public, pg_temp;
alter function validate_quote() set search_path = public, pg_temp;
alter function enforce_job_transition() set search_path = public, pg_temp;
alter function enforce_review_rules() set search_path = public, pg_temp;

-- 2) Move extensions out of public (Supabase includes `extensions` in the
-- default session search_path, so unqualified earth_distance keeps working
-- in RLS policies and index expressions).
create schema if not exists extensions;
alter extension cube set schema extensions;
alter extension earthdistance set schema extensions;

-- 3) Definer functions: deny-by-default, grant only what the API needs.
-- Trigger bodies run internally regardless of EXECUTE grants.
revoke execute on function accept_quote(uuid, timestamptz, timestamptz) from public, anon;
revoke execute on function expire_stale_quotes() from public, anon;
revoke execute on function auth_role() from public, anon;
revoke execute on function is_blocked_pair(uuid, uuid) from public, anon;
-- Pure trigger functions: nobody calls these over RPC.
revoke execute on function after_quote_insert() from public, anon, authenticated;
revoke execute on function recalc_provider_metrics() from public, anon, authenticated;

-- Explicit grants for the authenticated API surface.
grant execute on function accept_quote(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function expire_stale_quotes() to authenticated;
grant execute on function auth_role() to authenticated;
grant execute on function is_blocked_pair(uuid, uuid) to authenticated;
