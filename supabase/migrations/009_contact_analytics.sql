-- Anonymous, bounded marketing events; no phone numbers, vehicle input, IPs or search text.
create table if not exists public.marketing_events (
  day date not null default (now() at time zone 'Asia/Seoul')::date,
  session_id uuid not null,
  page text not null check (page in ('home','mission','diesel','work','works','other')),
  landing text not null check (landing in ('home','mission','diesel','work','works','other')),
  source text not null check (source in ('naver_mission','naver_diesel','naver_other','naver','google','other','direct')),
  event text not null check (event in ('visit','phone','sms','place','map')),
  primary key (day, session_id, page, event)
);
alter table public.marketing_events enable row level security;
revoke all on public.marketing_events from anon, authenticated;
grant select on public.marketing_events to authenticated;
create policy marketing_admin_read on public.marketing_events for select to authenticated using (public.is_site_admin());

create or replace function public.record_marketing_event(p_session uuid, p_page text, p_landing text, p_source text, p_event text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_session is null or p_page is null or p_landing is null or p_source is null or p_event is null
    or p_page not in ('home','mission','diesel','work','works','other')
    or p_landing not in ('home','mission','diesel','work','works','other')
    or p_source not in ('naver_mission','naver_diesel','naver_other','naver','google','other','direct')
    or p_event not in ('visit','phone','sms','place','map') then
    raise exception 'Invalid event' using errcode = '22023';
  end if;
  insert into public.marketing_events (session_id,page,landing,source,event)
    values (p_session,p_page,p_landing,p_source,p_event) on conflict do nothing;
  -- Clean only this feature's expired anonymous events whenever traffic arrives.
  delete from public.marketing_events where day < (now() at time zone 'Asia/Seoul')::date - 89;
end;
$$;
revoke all on function public.record_marketing_event(uuid,text,text,text,text) from public;
grant execute on function public.record_marketing_event(uuid,text,text,text,text) to anon, authenticated;

create or replace function public.marketing_summary(p_days integer default 14)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  if not public.is_site_admin() then raise exception 'Admin required' using errcode = '42501'; end if;
  with recent as (
    select * from public.marketing_events where day >= (now() at time zone 'Asia/Seoul')::date - (least(90,greatest(1,coalesce(p_days,14))) - 1)
  ), totals as (
    select count(distinct (day,session_id)) filter (where event='visit') as visits,
      count(distinct (day,session_id)) filter (where event='phone') as phone,
      count(distinct (day,session_id)) filter (where event='sms') as sms,
      count(distinct (day,session_id)) filter (where event in ('place','map')) as location from recent
  ), sources as (
    select source, count(distinct (day,session_id)) filter(where event='visit') as visits,
      count(distinct (day,session_id)) filter(where event='phone') as phone,
      count(distinct (day,session_id)) filter(where event='sms') as sms from recent group by source
  ), landings as (
    select landing, count(distinct (day,session_id)) filter(where event='visit') as visits,
      count(distinct (day,session_id)) filter(where event='phone') as phone,
      count(distinct (day,session_id)) filter(where event='sms') as sms from recent group by landing
  ), daily as (
    select day, count(distinct session_id) filter(where event='visit') as visits,
      count(distinct session_id) filter(where event='phone') as phone,
      count(distinct session_id) filter(where event='sms') as sms from recent group by day order by day desc
  )
  select jsonb_build_object('totals',(select to_jsonb(t) from totals t),
    'sources',coalesce((select jsonb_agg(s order by visits desc) from sources s),'[]'::jsonb),
    'landings',coalesce((select jsonb_agg(l order by visits desc) from landings l),'[]'::jsonb),
    'daily',coalesce((select jsonb_agg(d order by day desc) from daily d),'[]'::jsonb)) into result;
  return result;
end;
$$;
revoke all on function public.marketing_summary(integer) from public;
grant execute on function public.marketing_summary(integer) to authenticated;
