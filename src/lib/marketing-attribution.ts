export type TrafficDevice = "mobile" | "tablet" | "desktop" | "unknown";
export const detailedSourceLabels: Record<string, string> = {
  naver_paid_diesel: "네이버 광고 · 디젤",
  naver_paid_mission: "네이버 광고 · 미션",
  naver_paid_ev: "네이버 광고 · 전기차",
  naver_paid_other: "네이버 광고 · 기타",
  naver_search: "네이버 검색 · 광고표시 없음",
  naver_blog: "네이버 블로그",
  naver_map: "네이버 지도·플레이스",
  naver_other: "네이버 · 상세 경로 확인 불가",
  google_search: "구글 · 광고표시 없음",
  google_paid: "구글 광고",
  daangn_paid: "당근 광고",
  daangn: "당근 · 광고표시 없음",
  instagram: "인스타그램",
  youtube: "유튜브",
  facebook: "페이스북",
  bing: "빙",
  direct: "직접 방문·확인 불가",
  other: "기타 외부 유입",
};

const NAVER_GROUPS: Record<string, string> = {
  "grp-a001-01-000000073468534": "diesel",
  "grp-a001-01-000000073461151": "mission",
  "grp-a001-01-000000073947574": "ev",
};

/** Store known public page paths only; never queries, fragments or form content. */
export function publicAnalyticsPath(path: string): string | null {
  const clean = path.split(/[?#]/, 1)[0];
  if (["/", "/works", "/services/transmission", "/services/electric-vehicle", "/services/diesel-cleaning", "/services/diesel-cleaning/intake", "/services/diesel-cleaning/injector", "/services/diesel-cleaning/dpf"].includes(clean)) return clean;
  if (/^\/works\/[a-zA-Z0-9_%가-힣-]{1,180}$/.test(clean)) return clean;
  return null;
}

export function trafficDevice(userAgent: string): TrafficDevice {
  if (!userAgent) return "unknown";
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) return "tablet";
  if (/Mobi|iPhone|iPod/i.test(userAgent)) return "mobile";
  return "desktop";
}

export function trafficSource(search: string, referrer: string, hostname: string) {
  const params = new URLSearchParams(search);
  const utmSource = (params.get("utm_source") || "").toLowerCase();
  const paidMedium = /^(cpc|ppc|paid|paid_social|display)$/.test((params.get("utm_medium") || "").toLowerCase());
  const knownNaverAd = ["n_ad", "n_ad_group", "n_campaign"].some(key => params.has(key));
  if ((utmSource === "naver" && paidMedium) || knownNaverAd) {
    const content = params.get("utm_content");
    const group = NAVER_GROUPS[params.get("n_ad_group") || ""];
    const campaign = group || (content === "mission" || content === "diesel" ? content : /^(ev|electric_vehicle|electric-vehicle)$/.test(content || "") ? "ev" : "other");
    return { source: campaign === "diesel" ? "naver_diesel" : campaign === "mission" ? "naver_mission" : "naver_other", detail: `naver_paid_${campaign}` };
  }
  if ((utmSource === "google" && paidMedium) || params.has("gclid") || params.has("gbraid") || params.has("wbraid")) return { source: "google", detail: "google_paid" };
  if (/^(daangn|karrot)$/.test(utmSource)) return { source: "other", detail: paidMedium ? "daangn_paid" : "daangn" };
  if (/^(instagram|youtube|facebook)$/.test(utmSource)) return { source: "other", detail: utmSource };
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    const is = (domain: string) => host === domain || host.endsWith(`.${domain}`);
    if (host === hostname || (is("koreauto.co.kr") && hostname.endsWith("koreauto.co.kr"))) return { source: "direct", detail: "direct" };
    if (is("naver.com")) {
      const detail = /(^|\.)(m\.)?search\.naver\.com$/.test(host) ? "naver_search"
        : is("blog.naver.com") ? "naver_blog"
        : is("map.naver.com") || is("place.naver.com") ? "naver_map" : "naver_other";
      return { source: "naver", detail };
    }
    if (is("google.com") || is("google.co.kr")) return { source: "google", detail: "google_search" };
    for (const [domain, detail] of [["daangn.com", "daangn"], ["karrotmarket.com", "daangn"], ["instagram.com", "instagram"], ["youtube.com", "youtube"], ["youtu.be", "youtube"], ["facebook.com", "facebook"], ["bing.com", "bing"]]) {
      if (is(domain)) return { source: "other", detail };
    }
    return { source: "other", detail: "other" };
  } catch { return { source: "direct", detail: "direct" }; }
}
