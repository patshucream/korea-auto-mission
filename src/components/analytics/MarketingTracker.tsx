"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { tryCreateClient } from "@/lib/supabase/client";

const KEY = "korea-marketing-session-v1";
export const OPT_OUT = "korea-marketing-optout";
type Session = { day: string; id: string; landing: string; source: string };
function pageGroup(path: string) {
  if (path === "/") return "home";
  if (path === "/services/transmission") return "mission";
  if (path === "/services/diesel-cleaning") return "diesel";
  if (path === "/works") return "works";
  if (path.startsWith("/works/")) return "work";
  return "other";
}
function sourceGroup() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("utm_source") === "naver" && params.get("utm_medium") === "cpc") {
    const content = params.get("utm_content");
    return content === "mission" ? "naver_mission" : content === "diesel" ? "naver_diesel" : "naver_other";
  }
  try {
    const host = new URL(document.referrer).hostname;
    if (host === location.hostname) return "direct";
    if (/(^|\.)naver\.com$/.test(host)) return "naver";
    if (/(^|\.)google\.(com|co\.kr)$/.test(host)) return "google";
    return "other";
  } catch { return "direct"; }
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
        session = { day, id: crypto.randomUUID(), landing: pageGroup(pathname), source: sourceGroup() };
        sessionStorage.setItem(KEY, JSON.stringify(session));
      }
      const current = session;
      function record(event: string) {
        if (localStorage.getItem(OPT_OUT) === "1") return;
        void client!.rpc("record_marketing_event", { p_session:current.id, p_page:pageGroup(pathname!), p_landing:current.landing, p_source:current.source, p_event:event }).then(() => {}, () => {});
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
