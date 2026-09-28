import { detailedSourceLabels, publicAnalyticsPath } from "./marketing-attribution";

export const marketingSourceLabels: Record<string, string> = {
  naver_mission: "네이버 광고 · 미션",
  naver_diesel: "네이버 광고 · 디젤",
  naver_other: "네이버 광고 · 기타",
  naver: "네이버 · 광고표시 없음",
  google: "구글",
  direct: "직접 방문·확인 불가",
  other: "기타",
};

export const marketingPageLabels: Record<string, string> = {
  home: "홈",
  mission: "미션수리 안내",
  diesel: "디젤 클리닝 안내",
  works: "작업사례 목록",
  work: "작업사례 글",
  other: "기타 페이지",
};

export type MarketingEvent = {
  day: string;
  session_id: string;
  source: string;
  landing: string;
  page: string;
  event: string;
  observed_at?: string | null;
  details?: { version?: number; device?: string; source_detail?: string; landing_path?: string; page_path?: string } | null;
};

export type ContactVisit = {
  key: string;
  day: string;
  sources: string[];
  landings: string[];
  phonePages: string[];
  smsPages: string[];
};

/** Matches the summary's distinct (KST day, anonymous session) counts. */
export function groupContactVisits(events: MarketingEvent[]): ContactVisit[] {
  const visits = new Map<string, ContactVisit>();
  for (const event of events) {
    if (event.event !== "phone" && event.event !== "sms") continue;
    const key = `${event.day}:${event.session_id}`;
    let visit = visits.get(key);
    if (!visit) {
      visit = { key, day: event.day, sources: [], landings: [], phonePages: [], smsPages: [] };
      visits.set(key, visit);
    }
    for (const [values, value] of [
      [visit.sources, event.source],
      [visit.landings, event.landing],
      [event.event === "phone" ? visit.phonePages : visit.smsPages, event.page],
    ] as [string[], string][]) {
      if (!values.includes(value)) values.push(value);
    }
  }
  return [...visits.values()].sort((a, b) => b.day.localeCompare(a.day) || a.key.localeCompare(b.key));
}

/** Inclusive start date, matching marketing_summary's Korea-time date window. */
export function marketingStartDay(days: number, now = new Date()): string {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(now);
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - (Math.min(90, Math.max(1, days)) - 1));
  return start.toISOString().slice(0, 10);
}

export const deviceLabels: Record<string, string> = { mobile: "모바일", tablet: "태블릿", desktop: "PC", unknown: "미수집" };
export type TrafficVisit = {
  key: string; day: string; sourceKey: string; sourceLabel: string; device: string;
  landing: string; landingPath: string | null; firstAt: string | null;
  visited: boolean; phone: boolean; sms: boolean; location: boolean; events: MarketingEvent[];
};
export function buildTrafficVisits(events: MarketingEvent[]): TrafficVisit[] {
  const byVisit = new Map<string, MarketingEvent[]>();
  for (const event of events) {
    const key = `${event.day}:${event.session_id}`;
    const existing = byVisit.get(key) || [];
    existing.push(event);
    byVisit.set(key, existing);
  }
  return [...byVisit.entries()].map(([key, rows]) => {
    const first = rows.find(row => row.event === "visit") || rows[0];
    const detail = rows.find(row => row.details?.source_detail)?.details?.source_detail;
    const device = rows.find(row => row.details?.device)?.details?.device || "unknown";
    const visitTimes = rows.filter(row => row.event === "visit" && row.observed_at).map(row => row.observed_at!).sort();
    return {
      key, day: first.day,
      sourceKey: detail && detailedSourceLabels[detail] ? detail : `legacy:${first.source}`,
      sourceLabel: detail && detailedSourceLabels[detail] ? detailedSourceLabels[detail] : marketingSourceLabels[first.source] || "확인 불가",
      device: deviceLabels[device] ? device : "unknown",
      landing: first.landing,
      landingPath: publicAnalyticsPath(rows.find(row => row.details?.landing_path)?.details?.landing_path || "") || null,
      firstAt: rows.some(row => row.event === "visit" && !row.observed_at) ? null : visitTimes[0] || null,
      visited: rows.some(row => row.event === "visit"),
      phone: rows.some(row => row.event === "phone"),
      sms: rows.some(row => row.event === "sms"),
      location: rows.some(row => row.event === "place" || row.event === "map"),
      events: rows,
    };
  }).sort((a, b) => b.day.localeCompare(a.day) || (b.firstAt || "").localeCompare(a.firstAt || "") || a.key.localeCompare(b.key));
}

export function trafficTotals(visits: TrafficVisit[]) {
  const visited = visits.filter(v => v.visited);
  const contacts = visits.filter(v => v.phone || v.sms).length;
  const contactsWithVisit = visited.filter(v => v.phone || v.sms).length;
  return {
    visits: visited.length, phone: visits.filter(v => v.phone).length, sms: visits.filter(v => v.sms).length,
    contacts, contactsWithVisit, location: visits.filter(v => v.location).length,
    rate: visited.length ? contactsWithVisit / visited.length * 100 : null,
  };
}

export function trafficBreakdown(visits: TrafficVisit[], dimension: "source" | "device" | "landing" | "day" | "hour") {
  const groups = new Map<string, { label: string; visits: TrafficVisit[] }>();
  for (const visit of visits) {
    const key = dimension === "source" ? visit.sourceKey : dimension === "device" ? visit.device
      : dimension === "landing" ? visit.landingPath || `legacy:${visit.landing}` : dimension === "day" ? visit.day
      : visit.firstAt ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", hourCycle: "h23" }).format(new Date(visit.firstAt)) : "unknown";
    const label = dimension === "source" ? visit.sourceLabel : dimension === "device" ? deviceLabels[key]
      : dimension === "landing" ? analyticsPageName(visit.landingPath, visit.landing)
      : dimension === "hour" ? key === "unknown" ? "시각 미수집" : `${key}시 방문` : key;
    const group = groups.get(key) || { label, visits: [] };
    group.visits.push(visit);
    groups.set(key, group);
  }
  return [...groups.entries()].map(([key, value]) => ({ key, label: value.label, ...trafficTotals(value.visits) }))
    .sort((a, b) => dimension === "day" ? b.key.localeCompare(a.key) : dimension === "hour" ? a.key.localeCompare(b.key) : b.visits - a.visits || a.label.localeCompare(b.label));
}

export function analyticsPageName(path: string | null | undefined, fallback: string, workTitles: Record<string, string> = {}) {
  if (!path) return marketingPageLabels[fallback] || "기타 페이지";
  const names: Record<string, string> = {
    "/": "홈", "/works": "작업사례 목록", "/services/transmission": "미션수리 안내", "/services/electric-vehicle": "전기차 수리 안내",
    "/services/diesel-cleaning": "디젤 클리닝 안내", "/services/diesel-cleaning/intake": "흡기 클리닝 안내", "/services/diesel-cleaning/injector": "인젝터 클리닝 안내", "/services/diesel-cleaning/dpf": "DPF 클리닝 안내",
  };
  let slug = path.slice(7);
  try { slug = decodeURI(slug); } catch { /* Keep the safe stored path when encoding is incomplete. */ }
  return workTitles[path] || names[path] || (path.startsWith("/works/") ? `작업사례 · ${slug}` : marketingPageLabels[fallback] || "기타 페이지");
}

export function trafficWindow(params: Record<string, string | undefined>, now = new Date()) {
  const today = marketingStartDay(1, now);
  const oldest = marketingStartDay(90, now);
  const days = [7, 14, 30, 90].includes(Number(params.days)) ? Number(params.days) : 14;
  const valid = (s: string | undefined): s is string => Boolean(s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s && s >= oldest && s <= today);
  const custom = valid(params.start) && valid(params.end) && params.start <= params.end;
  return { start: custom ? params.start! : marketingStartDay(days, now), end: custom ? params.end! : today, today, oldest, days };
}

export function contactCsv(visits: TrafficVisit[], workTitles: Record<string, string> = {}) {
  const cell = (value: string) => `"${(/^[=+@\-\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
  const rows = [["내역 번호", "날짜(KST)", "유입 경로", "기기", "첫 접속 페이지", "전화·문자 버튼", "버튼 클릭 시각(KST)", "버튼 클릭 페이지"]];
  visits.forEach((visit, index) => {
    for (const event of visit.events.filter(e => e.event === "phone" || e.event === "sms")) {
      rows.push([String(index + 1), visit.day, visit.sourceLabel, deviceLabels[visit.device], analyticsPageName(visit.landingPath, visit.landing, workTitles), event.event === "phone" ? "전화 버튼" : "문자 버튼", event.observed_at ? new Date(event.observed_at).toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }) : "미수집", analyticsPageName(publicAnalyticsPath(event.details?.page_path || ""), event.page, workTitles)]);
    }
  });
  return "\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n");
}
