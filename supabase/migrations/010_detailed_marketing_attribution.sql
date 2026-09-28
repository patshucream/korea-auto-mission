-- Extend existing anonymous statistics. Existing rows remain unmodified/unknown.
begin;
alter table public.marketing_events add column if not exists observed_at timestamptz;
alter table public.marketing_events alter column observed_at set default now();
alter table public.marketing_events add column if not exists details jsonb;

create or replace function public.record_marketing_event_v2(
  p_session uuid, p_page text, p_landing text, p_source text, p_event text,
  p_details jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path = '' as $$
declare
  safe_device text;
  safe_source text;
  safe_landing text;
  safe_page text;
begin
  if p_session is null or p_page is null or p_landing is null or p_source is null or p_event is null
    or p_page not in ('home','mission','diesel','work','works','other')
    or p_landing not in ('home','mission','diesel','work','works','other')
    or p_source not in ('naver_mission','naver_diesel','naver_other','naver','google','other','direct')
    or p_event not in ('visit','phone','sms','place','map') then
    raise exception 'Invalid event' using errcode = '22023';
  end if;
  safe_device := case when p_details->>'device' in ('mobile','tablet','desktop') then p_details->>'device' else null end;
  safe_source := case when p_details->>'source_detail' in (
    'naver_paid_diesel','naver_paid_mission','naver_paid_ev','naver_paid_other',
    'naver_search','naver_blog','naver_map','naver_other','google_search','google_paid',
    'daangn_paid','daangn','instagram','youtube','facebook','bing','direct','other'
  ) then p_details->>'source_detail' else null end;
  safe_landing := p_details->>'landing_path';
  safe_page := p_details->>'page_path';
  if safe_landing not in ('/','/works','/services/transmission','/services/electric-vehicle','/services/diesel-cleaning','/services/diesel-cleaning/intake','/services/diesel-cleaning/injector','/services/diesel-cleaning/dpf')
    and coalesce(safe_landing,'') !~ '^/works/[a-zA-Z0-9_%가-힣-]{1,180}$' then safe_landing := null; end if;
  if safe_page not in ('/','/works','/services/transmission','/services/electric-vehicle','/services/diesel-cleaning','/services/diesel-cleaning/intake','/services/diesel-cleaning/injector','/services/diesel-cleaning/dpf')
    and coalesce(safe_page,'') !~ '^/works/[a-zA-Z0-9_%가-힣-]{1,180}$' then safe_page := null; end if;
  insert into public.marketing_events(session_id,page,landing,source,event,details)
    values(p_session,p_page,p_landing,p_source,p_event,jsonb_strip_nulls(jsonb_build_object(
      'version',2,'device',safe_device,'source_detail',safe_source,'landing_path',safe_landing,'page_path',safe_page
    ))) on conflict do nothing;
  -- Preserve the existing 90-day retention policy.
  delete from public.marketing_events where day < (now() at time zone 'Asia/Seoul')::date - 89;
end;
$$;
revoke all on function public.record_marketing_event_v2(uuid,text,text,text,text,jsonb) from public;
grant execute on function public.record_marketing_event_v2(uuid,text,text,text,text,jsonb) to anon, authenticated;
-- Existing table RLS and administrator-only SELECT remain unchanged.
commit;
