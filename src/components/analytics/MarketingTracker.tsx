"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { tryCreateClient } from "@/lib/supabase/client";
import { publicAnalyticsPath, trafficDevice, trafficSource } from "@/lib/marketing-attribution";

const KEY = "korea-marketing-session-v1";
export const OPT_OUT = "korea-marketing-optout";
type Session = { day: string; id: string; landing: string; source: string; sourceDetail?: string; landingPath?: string | null };
function pageGroup(path: string) {
  if (path === "/") return "home";
  if (path === "/services/transmission") return "mission";
  if (path === "/services/diesel-cleaning" || path.startsWith("/services/diesel-cleaning/")) return "diesel";
  if (path === "/works") return "works";
  if (path.startsWith("/works/")) return "work";
  return "other";
}

export function MarketingTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || !["koreauto.co.kr", "www.koreauto.co.kr"].includes(location.hostname)) return;
    try {
      if (pathname.startsWith("/admin")) { sessionStorage.setItem("korea-admin-visit", "1"); return; }
      if (navigator.doNotTrack === "1" || localStorage.getItem(OPT_OUT) === "1" || sessionStorage.getItem("korea-admin-visit")) return;
      const client = tryCreateClient();
      if (!client) return;
      const day = new Intl.DateTimeFormat("sv-SE", {timeZone:"Asia/Seoul"}).format(new Date());
      let session: Session | null = null;
      try { session = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch { /* A blocked/invalid store disables this visit only. */ }
      if (!session || session.day !== day) {
        const attribution = trafficSource(window.location.search, document.referrer, location.hostname);
        session = { day, id: crypto.randomUUID(), landing: pageGroup(pathname), source: attribution.source, sourceDetail: attribution.detail, landingPath: publicAnalyticsPath(pathname) };
        sessionStorage.setItem(KEY, JSON.stringify(session));
      }
      const current = session;
      function record(event: string) {
        if (localStorage.getItem(OPT_OUT) === "1") return;
        const args = { p_session:current.id, p_page:pageGroup(pathname!), p_landing:current.landing, p_source:current.source, p_event:event };
        void client!.rpc("record_marketing_event_v2", { ...args, p_details: {
          device: trafficDevice(navigator.userAgent),
          source_detail: current.sourceDetail || null,
          landing_path: current.landingPath || null,
          page_path: publicAnalyticsPath(pathname!),
        } }).then(({error}) => {
          // Deploy safely even if the database update is still pending.
          if (error?.code === "PGRST202") void client!.rpc("record_marketing_event", args).then(() => {}, () => {});
        }, () => {});
      }
      record("visit");
      function click(event: MouseEvent) {
        const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (!link) return;
        const href = link.getAttribute("href") || "";
        if (href.startsWith("tel:")) record("phone");
        else if (href.startsWith("sms:")) record("sms");
        else if (/^https:\/\/(m\.)?place\.naver\.com\//.test(href)) record("place");
        else if (/^https:\/\/(map\.naver\.com|naver\.me|maps\.app\.goo\.gl)\//.test(href)) record("map");
      }
      document.addEventListener("click", click, true);
      return () => document.removeEventListener("click", click, true);
    } catch { /* Analytics must never interrupt the customer journey. */ }
  }, [pathname]);
  return null;
}
