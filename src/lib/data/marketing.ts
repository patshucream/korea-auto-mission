import type { SupabaseClient } from "@supabase/supabase-js";
import { buildTrafficVisits, trafficWindow, type MarketingEvent } from "@/lib/marketing-contacts";

export async function loadMarketingReport(supabase: SupabaseClient, params: Record<string, string | undefined>) {
  const window = trafficWindow(params);
  let detailed = true;
  let events: MarketingEvent[] = [];
  let failed = false;
  let truncated = false;
  // Bounded paging avoids Supabase's default row limit silently truncating reports.
  for (let offset = 0; offset < 20000; offset += 500) {
    const columns = "day,session_id,source,landing,page,event" + (detailed ? ",observed_at,details" : "");
    const result = await supabase.from("marketing_events").select(columns, { count: "exact" })
      .gte("day", window.start).lte("day", window.end)
      .order("day", { ascending: false }).order("session_id").order("page").order("event")
      .range(offset, offset + 499);
    if (result.error && offset === 0 && detailed && ["42703", "PGRST204"].includes(result.error.code)) {
      detailed = false;
      offset = -500;
      continue;
    }
    if (result.error) { failed = true; events = []; break; }
    const batch = (result.data || []) as unknown as MarketingEvent[];
    events.push(...batch);
    if (events.length >= (result.count || 0) || batch.length === 0) break;
    if (offset === 19500) truncated = true;
  }
  const allVisits = buildTrafficVisits(events);
  const sourceOptions = [...new Map(allVisits.map(v => [v.sourceKey, v.sourceLabel])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const source = sourceOptions.some(([key]) => key === params.source) ? params.source! : "all";
  const device = ["mobile", "tablet", "desktop", "unknown"].includes(params.device || "") ? params.device! : "all";
  const action = ["phone", "sms"].includes(params.action || "") ? params.action! : "all";
  const visits = allVisits.filter(v => (source === "all" || v.sourceKey === source) && (device === "all" || v.device === device));
  const contacts = visits.filter(v => action === "phone" ? v.phone : action === "sms" ? v.sms : v.phone || v.sms);
  const workTitles: Record<string, string> = {};
  const paths = [...new Set(events.flatMap(e => [e.details?.landing_path, e.details?.page_path]).filter((p): p is string => Boolean(p?.startsWith("/works/"))))];
  if (paths.length) {
    const slugs = paths.map(path => { try { return decodeURIComponent(path.slice(7)); } catch { return path.slice(7); } });
    const result = await supabase.from("work_cases").select("slug,title").in("slug", slugs.slice(0, 500));
    for (const work of result.data || []) {
      workTitles[`/works/${work.slug}`] = work.title;
      workTitles[`/works/${encodeURIComponent(work.slug)}`] = work.title;
    }
  }
  return { window, visits, contacts, allVisits, sourceOptions, source, device, action, workTitles, failed, truncated, detailed };
}
