"use client";

import { useState } from "react";
import { analyticsPageName, deviceLabels, type TrafficVisit } from "@/lib/marketing-contacts";
import { publicAnalyticsPath } from "@/lib/marketing-attribution";

export function ContactAttribution({ visits, workTitles, exportHref }: {
  visits: TrafficVisit[]; workTitles: Record<string, string>; exportHref: string;
}) {
  const [limit, setLimit] = useState(10);
  const time = (at: string | null | undefined) => at ? new Date(at).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "시각 미수집";
  return <section className="admin-card mt-5" aria-labelledby="contact-attribution-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 id="contact-attribution-title" className="font-bold">문의 버튼을 누른 방문의 유입 경로</h2><p className="mt-1 text-sm text-muted">필터에 해당하는 방문 {visits.length}건</p></div>
      <a className="btn btn-secondary min-h-10 text-sm" href={exportHref}>문의 내역 CSV 내려받기</a>
    </div>
    <p className="mt-3 text-sm leading-6 text-muted">한 항목은 같은 날·같은 브라우저 탭의 방문입니다. 전화와 문자를 모두 누르면 함께 표시합니다. 버튼을 누른 페이지 종류별 최초 클릭을 기록하며 실제 통화·문자 발송이나 고객 신원을 확인하는 기능은 아닙니다.</p>
    {visits.length ? <ol className="mt-5 space-y-3">
      {visits.slice(0, limit).map((visit, index) => <li key={visit.key} className="rounded-xl border border-border p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold text-navy"><span className="mr-2 text-xs font-normal text-muted">{index + 1}</span>{visit.sourceLabel}</p>
          <p className="text-sm text-muted"><time dateTime={visit.day}>{visit.day}</time> · {deviceLabels[visit.device]}</p>
        </div>
        <dl className="mt-3 grid gap-4 text-sm md:grid-cols-2">
          <div><dt className="text-muted">첫 접속 페이지 · 방문 시각</dt><dd className="mt-1 font-medium">{analyticsPageName(visit.landingPath, visit.landing, workTitles)}</dd><dd className="mt-1 text-xs text-muted">{time(visit.firstAt)}{!visit.landingPath && " · 상세 주소 미수집"}</dd></div>
          <div><dt className="text-muted">문의 버튼 · 클릭한 페이지 · 클릭 시각</dt><dd className="mt-2 space-y-3">
            {visit.events.filter(event => event.event === "phone" || event.event === "sms").sort((a, b) => (a.observed_at || "").localeCompare(b.observed_at || "")).map(event => <div key={`${event.event}:${event.page}`}>
              <span className={`mr-2 inline-block rounded px-2 py-1 font-semibold ${event.event === "phone" ? "bg-slate-100 text-navy" : "bg-blue-50 text-blue-900"}`}>{event.event === "phone" ? "전화 버튼" : "문자 버튼"}</span>
              <span>{analyticsPageName(publicAnalyticsPath(event.details?.page_path || ""), event.page, workTitles)}</span>
              <p className="mt-1 text-xs text-muted">{time(event.observed_at)}</p>
            </div>)}
          </dd></div>
        </dl>
      </li>)}
    </ol> : <p className="mt-4 py-5 text-sm text-muted">선택한 조건에 해당하는 전화·문자 버튼 클릭이 없습니다.</p>}
    {visits.length > 10 && <div className="mt-5 flex items-center justify-between gap-3"><p className="text-xs text-muted">{Math.min(limit, visits.length)} / {visits.length}건 표시 · CSV는 전체 내역</p>{limit < visits.length && <button type="button" className="btn btn-secondary min-h-11 text-sm" onClick={() => setLimit(limit + 10)}>10건 더 보기</button>}</div>}
  </section>;
}
