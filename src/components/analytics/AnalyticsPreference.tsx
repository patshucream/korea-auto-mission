"use client";
import { useSyncExternalStore } from "react";
import { OPT_OUT } from "./MarketingTracker";
function subscribe(callback: () => void) { window.addEventListener("marketing-preference", callback); return () => window.removeEventListener("marketing-preference", callback); }
function snapshot() { try { return localStorage.getItem(OPT_OUT) === "1"; } catch { return true; } }
export function AnalyticsPreference() {
  const disabled = useSyncExternalStore(subscribe, snapshot, () => false);
  return <button type="button" className="btn btn-secondary mt-3" onClick={() => { try { localStorage.setItem(OPT_OUT, disabled ? "0" : "1"); window.dispatchEvent(new Event("marketing-preference")); } catch { /* Storage may be blocked by the browser. */ } }}>{disabled ? "이 브라우저의 이용 통계 허용" : "이 브라우저의 이용 통계 수집 중지"}</button>;
}
