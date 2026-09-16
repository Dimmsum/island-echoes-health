-- Billable third-party API usage counters (Google Places).
--
-- Google Places (New) bills per search at the Enterprise tier and its results may
-- not be cached, so cost scales linearly with usage forever and there is no
-- engineering fix on the read side. The only lever is calling it less, which means
-- a hard cap enforced before each call.
--
-- This lives in Postgres rather than in process memory on purpose: an in-memory
-- counter resets on every deploy, crash or restart, and does not exist across more
-- than one instance — both of which turn a daily budget cap into no cap at all.
-- Burst limiting stays in memory (see api/src/lib/rateLimit.ts); the daily *budget*
-- ceiling has to be durable.
--
-- Note: this is a spend guard inside our own API. It cannot limit usage of the key
-- from anywhere else, so it complements — never replaces — per-SKU quota caps and a
-- budget alert configured in Google Cloud Console.

-- ============================================================
-- STEP 1: The counter table. One row per (scope, metric, day).
-- ============================================================

create table if not exists public.api_usage_counters (
  -- 'global' for the whole-deployment budget cap, or a user id for per-user caps.
  scope       text        not null,
  -- Which billable thing is being counted, e.g. 'google_places'.
  metric      text        not null,
  -- UTC day. Counters are never reset; old rows are simply never read again.
  day         date        not null,
  count       integer     not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (scope, metric, day)
);

-- Only the API (service role) ever touches this. No client-facing policy: with RLS
-- enabled and no policy, authenticated users can neither read nor write it, which
-- is what we want — usage counts are operational data, not user data.
alter table public.api_usage_counters enable row level security;

-- Lets an operator clear out old counters cheaply if the table is ever pruned.
create index if not exists idx_api_usage_counters_day
  on public.api_usage_counters(day);

-- ============================================================
-- STEP 2: Atomic check-and-increment.
--
-- The check and the increment MUST be one statement. Doing "select count, then
-- update" in the application races: concurrent requests all read the same
-- under-limit value and every one of them proceeds, overshooting the cap and the
-- budget with it. The conditional ON CONFLICT below makes the limit test and the
-- increment a single atomic operation — when the row is already at the limit the
-- update is skipped, nothing is returned, and the caller is denied.
-- ============================================================

drop function if exists public.increment_api_usage(text, text, integer);

create or replace function public.increment_api_usage(
  p_scope   text,
  p_metric  text,
  p_limit   integer
)
-- allowed: whether this call may proceed.
-- current_count: usage after this call (or the value it is stuck at when denied).
returns table (allowed boolean, current_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_today date := (now() at time zone 'utc')::date;
begin
  -- A limit of zero (or less) disables the integration outright.
  if p_limit <= 0 then
    select c.count into v_count
    from public.api_usage_counters c
    where c.scope = p_scope and c.metric = p_metric and c.day = v_today;
    return query select false, coalesce(v_count, 0);
    return;
  end if;

  insert into public.api_usage_counters as c (scope, metric, day, count)
  values (p_scope, p_metric, v_today, 1)
  on conflict (scope, metric, day) do update
    set count = c.count + 1,
        updated_at = now()
    where c.count < p_limit
  returning c.count into v_count;

  -- No row returned means the conditional update was skipped: already at the cap.
  if v_count is null then
    select c2.count into v_count
    from public.api_usage_counters c2
    where c2.scope = p_scope and c2.metric = p_metric and c2.day = v_today;
    return query select false, coalesce(v_count, 0);
    return;
  end if;

  return query select true, v_count;
end;
$$;

-- Service role only. Never expose the counter to end users.
-- The role guard keeps this runnable outside Supabase (a scratch database has no
-- anon/authenticated roles), so the file stays idempotent everywhere.
revoke all on function public.increment_api_usage(text, text, integer) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.increment_api_usage(text, text, integer) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function public.increment_api_usage(text, text, integer) from authenticated;
  end if;
end
$$;

-- ============================================================
-- STEP 3: Read-only helper so an operator can see today's spend at a glance.
-- ============================================================

drop function if exists public.get_api_usage_today(text);

create or replace function public.get_api_usage_today(p_metric text)
returns table (scope text, current_count integer)
language sql
security definer
set search_path = public
as $$
  select c.scope, c.count
  from public.api_usage_counters c
  where c.metric = p_metric
    and c.day = (now() at time zone 'utc')::date
  order by c.count desc;
$$;

revoke all on function public.get_api_usage_today(text) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function public.get_api_usage_today(text) from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on function public.get_api_usage_today(text) from authenticated;
  end if;
end
$$;
